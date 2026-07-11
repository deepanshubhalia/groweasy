import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSV } from '../utils/csv.parser.js';
import { mapBatchToCRM } from '../services/gemini.service.js';
import { CRMRecord, ImportResult } from '../types/crm.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit file size to 5MB as per UI template
  }
});

// Helper to chunk array into batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

router.post('/import', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No CSV file was uploaded.' });
      return;
    }

    const csvText = req.file.buffer.toString('utf-8');
    if (!csvText.trim()) {
      res.status(400).json({ error: 'The uploaded CSV file is empty.' });
      return;
    }

    // Parse CSV to raw records (JSON objects with arbitrary keys)
    let rawRecords: Record<string, string>[];
    try {
      rawRecords = await parseCSV(csvText);
    } catch (parseError: any) {
      res.status(400).json({ error: `Malformed CSV file: ${parseError.message}` });
      return;
    }

    if (rawRecords.length === 0) {
      res.status(400).json({ error: 'No valid rows found in the CSV file.' });
      return;
    }

    // Process in batches of 20 records to manage prompt size and rate limits
    const BATCH_SIZE = 20;
    const batches = chunkArray(rawRecords, BATCH_SIZE);
    const parsedRecords: CRMRecord[] = [];
    const skippedRecords: ImportResult['skipped'] = [];

    console.log(`Processing ${rawRecords.length} records in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}...`);
      try {
        const mappedBatch = await mapBatchToCRM(batches[i]);
        
        // Match mapped output with raw records to check for skips and retain raw representation if needed
        mappedBatch.forEach((mappedRecord, idx) => {
          const rawRecord = batches[i][idx] || {};
          
          // Enforce skip rule: must have at least email OR mobile number
          const email = mappedRecord.email?.trim();
          const phone = mappedRecord.mobile_without_country_code?.trim();

          if (!email && !phone) {
            skippedRecords.push({
              record: rawRecord,
              reason: 'Skipped: Record is missing both email and mobile number.'
            });
          } else {
            parsedRecords.push(mappedRecord);
          }
        });
      } catch (batchError: any) {
        console.error(`Error processing batch ${i + 1}:`, batchError);
        // If Gemini fails, we skip this entire batch and record the error for each row
        batches[i].forEach((rawRecord) => {
          skippedRecords.push({
            record: rawRecord,
            reason: `Skipped: AI processing failed for this batch (${batchError.message || batchError})`
          });
        });
      }
    }

    const responseData: ImportResult = {
      parsed: parsedRecords,
      skipped: skippedRecords,
      totalImported: parsedRecords.length,
      totalSkipped: skippedRecords.length
    };

    res.status(200).json(responseData);
  } catch (err: any) {
    console.error('Import controller error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message || err}` });
  }
});

export default router;

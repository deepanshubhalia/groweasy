import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Parses CSV file contents and converts them into an array of JSON records.
 * Trims whitespace from keys and values, and filters out completely empty rows.
 */
export function parseCSV(csvText: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    const stream = Readable.from(csvText);

    stream
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => value.trim()
      }))
      .on('data', (data) => {
        // Only keep if the row has at least one non-empty value
        const hasValues = Object.values(data).some(val => val !== '');
        if (hasValues) {
          results.push(data);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      });
  });
}

export interface ClientParsedCSV {
  headers: string[];
  rows: string[][];
  records: Record<string, string>[];
}

/**
 * Parses CSV string text into headers, rows, and key-value records.
 * Supports quoted fields with embedded commas and double-quote escapes.
 */
export function parseCSVClient(text: string): ClientParsedCSV {
  const result: string[][] = [];
  let row: string[] = [];
  let entry = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip escaped double quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim());
      entry = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip Unix LF in CRLF sequence
      }
      row.push(entry.trim());
      // Skip completely empty rows
      if (row.some(val => val !== '')) {
        result.push(row);
      }
      row = [];
      entry = '';
    } else {
      entry += char;
    }
  }

  // Handle remaining buffer at end of file
  if (entry || row.length > 0) {
    row.push(entry.trim());
    if (row.some(val => val !== '')) {
      result.push(row);
    }
  }

  if (result.length === 0) {
    return { headers: [], rows: [], records: [] };
  }

  const headers = result[0].map((h, idx) => h.trim() || `Column ${idx + 1}`);
  const rows = result.slice(1);
  
  const records = rows.map(rowValues => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = rowValues[idx] !== undefined ? rowValues[idx].trim() : '';
    });
    return record;
  });

  return { headers, rows, records };
}

import { parseCSV } from './utils/csv.parser.js';

const sampleCSV = `Full Name,E-mail,Mobile Number,Date Created,Lead Source,Remarks
Rahil Mohammad,rahil@test.com,919579290000,29-06-2026 10:00,leads_on_demand,Interested in 3BHK
Tarvinder Pal,tarvinderpal@beauty.com;tarvinder@other.com,9811362000,29-06-2026 10:00,meridian_tower,Warm lead
Dhruv Bisht,,+919711564000,29-06-2026 10:00,,Wants plots
Amit Raheja,,,,sarjapur_plots,No contact info
`;

async function runTest() {
  console.log('--- Testing CSV parsing ---');
  try {
    const parsed = await parseCSV(sampleCSV);
    console.log('Parsed CSV structure successfully:');
    console.log(JSON.stringify(parsed, null, 2));
    
    console.log('\n--- Checking validation and skipping rules (Mock) ---');
    // Test skip rules: neither email nor mobile number
    parsed.forEach((record, idx) => {
      // Find keys that might hold email or mobile
      const hasEmail = Object.keys(record).some(k => k.toLowerCase().includes('mail') && record[k].trim());
      const hasPhone = Object.keys(record).some(k => (k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('number')) && record[k].trim());
      
      if (!hasEmail && !hasPhone) {
        console.log(`Row ${idx + 1} ("${record['Full Name'] || record['name']}"): SKIPPED (missing email & mobile)`);
      } else {
        console.log(`Row ${idx + 1} ("${record['Full Name'] || record['name']}"): VALID`);
      }
    });
  } catch (err) {
    console.error('Error during test:', err);
  }
}

runTest();

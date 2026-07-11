import { mapBatchToCRM } from './services/gemini.service.js';

async function testCall() {
  console.log('🚀 Sending live test request to Gemini API...');
  const records = [
    {
      "Full Name": "Rahil Mohammad",
      "E-mail": "rahil@test.com;rahil.secondary@gmail.com",
      "Contact Info": "+91 95792 90000",
      "Date": "29-06-2026 10:00",
      "Source": "leads_on_demand",
      "Status": "Follow up required"
    }
  ];
  
  try {
    const result = await mapBatchToCRM(records);
    console.log('✅ Gemini API Response received successfully:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Gemini call failed:', err);
  }
}

testCall();

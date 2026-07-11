import { GoogleGenAI } from '@google/genai';
import { CRMRecord } from '../types/crm.js';
import dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY;
const grokKey = process.env.GROK_API_KEY;
const grokModel = process.env.GROK_MODEL || 'grok-2';
const hfKey = process.env.HF_API_KEY;
const hfModel = process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

const isGeminiConfigured = geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.trim() !== '';
const isGrokConfigured = grokKey && grokKey.trim() !== '';
const isHfConfigured = hfKey && hfKey.trim() !== '';

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// Define response schema for Gemini
const crmRecordSchema = {
  type: 'OBJECT',
  properties: {
    created_at: {
      type: 'STRING',
      description: 'ISO Date string or standard date format that is compatible with new Date(). If not found or empty, leave blank.'
    },
    name: {
      type: 'STRING',
      description: 'Full name or lead name.'
    },
    email: {
      type: 'STRING',
      description: 'First email address. If multiple emails exist, use the first one here, and append others to crm_note.'
    },
    country_code: {
      type: 'STRING',
      description: 'Country code digits (e.g., 91, 1, 44) without the plus sign. Extract this from phone fields if present.'
    },
    mobile_without_country_code: {
      type: 'STRING',
      description: 'Phone/Mobile number digits excluding country code, spaces, hyphens, or parentheses. If multiple mobile numbers exist, use the first here and append others to crm_note.'
    },
    company: {
      type: 'STRING',
      description: 'Company or organization name.'
    },
    city: {
      type: 'STRING',
      description: 'City name.'
    },
    state: {
      type: 'STRING',
      description: 'State or region name.'
    },
    country: {
      type: 'STRING',
      description: 'Country name.'
    },
    lead_owner: {
      type: 'STRING',
      description: 'Lead owner, agent, or representative.'
    },
    crm_status: {
      type: 'STRING',
      description: 'Must be mapped to one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. If unknown, uncertain, or not matching these, set to empty string "".'
    },
    crm_note: {
      type: 'STRING',
      description: 'Notes, remarks, comments, follow-up notes, additional phone numbers, additional emails, and any other column data that does not fit in other fields.'
    },
    data_source: {
      type: 'STRING',
      description: 'Must be mapped to one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. Otherwise set to empty string "".'
    },
    possession_time: {
      type: 'STRING',
      description: 'Possession time or duration if available.'
    },
    description: {
      type: 'STRING',
      description: 'General description or overview.'
    }
  },
  required: [
    'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
    'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
    'crm_note', 'data_source', 'possession_time', 'description'
  ]
};

const crmResponseSchema = {
  type: 'ARRAY',
  items: crmRecordSchema
};

/**
 * Mapped CRM formatting instructions prompt.
 */
function buildPrompt(records: Record<string, string>[]): string {
  return `Map the following JSON array of raw records (with arbitrary, unpredictable column headers) into the structured GrowEasy CRM schema:

CRM Fields & Mapping Rules:
1. "created_at": Map from column representing date/time created. Ensure the output string is compatible with new Date(created_at) (e.g. ISO 8601 format like "YYYY-MM-DDTHH:mm:ss.sssZ" or simple "YYYY-MM-DD HH:mm"). If invalid or missing, leave empty.
2. "name": Map from column representing full name, lead name, or first+last name.
3. "email": Extract the primary/first email. If multiple emails are listed in the email field or raw record, use the first email here and append all remaining emails to "crm_note".
4. "country_code" & "mobile_without_country_code": Look for phone, mobile, contact fields. Parse the number. Extract country code digits (without "+") into "country_code" and the rest of the digits (no spaces, dashes, or parentheses) into "mobile_without_country_code". If multiple phone numbers exist, use the first here and append the rest to "crm_note".
5. "company": Company, organization, or brand name.
6. "city", "state", "country": Address locations.
7. "lead_owner": Assigned sales agent or owner.
8. "crm_status": Map status fields. Allowed values: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. If uncertain or it doesn't match any, output an empty string "".
9. "data_source": Map source fields. Allowed values: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. If not a match, output an empty string "".
10. "possession_time": Property possession timeline info if present.
11. "description": Detailed description, requirements, or profile information.
12. "crm_note": Gather remarks, comments, follow-up details, additional phone numbers, additional emails, and any other columns that do not map to the above CRM fields. Concatenate them with clear headers.

Input Raw Records to Map:
${JSON.stringify(records, null, 2)}

Strictly adhere to the output schema. Output a JSON array containing mapped objects. Never hallucinate emails or mobile numbers. If a field cannot be confidently mapped, leave it as an empty string.`;
}

/**
 * Call the Grok API using direct HTTP request (OpenAI compatibility layer).
 */
async function callGrokAPI(promptText: string): Promise<CRMRecord[]> {
  console.log(`🤖 Routing request to Grok API using model ${grokModel}...`);
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grokKey}`
    },
    body: JSON.stringify({
      model: grokModel,
      messages: [
        {
          role: 'system',
          content: 'You are a professional CRM data cleaning expert. You always respond in a raw JSON array where each object conforms strictly to the target CRM schema properties: created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API Error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Grok API returned an empty response content.');
  }

  const parsed = JSON.parse(content);
  // Grok might wrap the array in a parent object, check for list formats
  if (Array.isArray(parsed)) {
    return parsed as CRMRecord[];
  } else if (parsed.records && Array.isArray(parsed.records)) {
    return parsed.records as CRMRecord[];
  } else if (typeof parsed === 'object') {
    const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
    if (possibleArray) {
      return possibleArray as CRMRecord[];
    }
  }

  throw new Error('Grok response could not be parsed as a CRM Record array.');
}

/**
 * Call the Gemini API.
 */
async function callGeminiAPI(promptText: string): Promise<CRMRecord[]> {
  if (!ai) throw new Error('Gemini API client not initialized.');
  console.log('♊ Routing request to Gemini API...');
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: promptText,
    config: {
      responseMimeType: 'application/json',
      responseSchema: crmResponseSchema,
      temperature: 0.1
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini API returned an empty response.');
  }

  return JSON.parse(responseText) as CRMRecord[];
}

/**
 * Call the Hugging Face Inference API.
 */
async function callHuggingFaceAPI(promptText: string): Promise<CRMRecord[]> {
  if (!hfKey) throw new Error('Hugging Face API key not configured.');
  console.log(`🤗 Routing request to Hugging Face API using model ${hfModel}...`);
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hfKey}`
    },
    body: JSON.stringify({
      model: hfModel,
      messages: [
        {
          role: 'system',
          content: 'You are a professional CRM data cleaning expert. You always respond in a raw JSON array where each object conforms strictly to the target CRM schema properties: created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      temperature: 0.1,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API Error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Hugging Face API returned empty response content.');
  }

  // Parse the content (clean up any markdown fences if present)
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanContent);
  if (Array.isArray(parsed)) {
    return parsed as CRMRecord[];
  } else if (parsed.records && Array.isArray(parsed.records)) {
    return parsed.records as CRMRecord[];
  } else if (typeof parsed === 'object') {
    const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
    if (possibleArray) {
      return possibleArray as CRMRecord[];
    }
  }

  throw new Error('Hugging Face response could not be parsed as a CRM Record array.');
}

/**
 * Maps a batch of raw records to CRMRecord format using either Gemini, Grok, or Hugging Face API.
 */
export async function mapBatchToCRM(records: Record<string, string>[]): Promise<CRMRecord[]> {
  const promptText = buildPrompt(records);

  if (isHfConfigured) {
    return callHuggingFaceAPI(promptText);
  }

  if (isGrokConfigured) {
    return callGrokAPI(promptText);
  }

  if (isGeminiConfigured) {
    return callGeminiAPI(promptText);
  }

  throw new Error('No active LLM API key configured in backend environment (.env). Please provide GEMINI_API_KEY, GROK_API_KEY, or HF_API_KEY.');
}

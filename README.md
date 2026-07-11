# GrowEasy AI-Powered CSV Importer

An intelligent, full-stack CSV importer designed for GrowEasy CRM. It accepts CSV files of arbitrary structures (with completely unpredictable column headers), parses them, and leverages Gemini AI to map raw records into the GrowEasy CRM schema.

## Features

- **Drag & Drop / File Picker**: A modern, clean, responsive upload page.
- **Client-Side CSV Preview**: Instant table parsing for preview with sticky headers, horizontal scrolling, and vertical paging.
- **Gemini AI Mapping**: Automatically maps arbitrary headers (e.g. "Electronic Mail" -> "email", "Buyer" -> "name") to the GrowEasy target schema in batches.
- **Data Integrity / Clean Post-Processing**:
  - Validates and maps status and source fields to enum options.
  - Normalizes timestamps to ISO-compatible strings.
  - Splits multiple emails and phone numbers, saving additional entries into CRM notes.
  - Automatically filters out invalid leads (skipping rows lacking both email and mobile numbers).
- **Import Statistics & Result Grid**: Shows total imports, skipped rows, and interactive result grids with download capabilities.

---

## Project Structure

```text
csv-importer/
├── backend/                  # Node.js + Express (TypeScript)
│   ├── src/
│   │   ├── controllers/      # Route controllers/handlers
│   │   ├── routes/           # Express routes (import.routes.ts)
│   │   ├── services/         # Gemini AI mapping service (gemini.service.ts)
│   │   ├── types/            # TypeScript interfaces (crm.ts)
│   │   ├── utils/            # Helper utilities (csv.parser.ts)
│   │   ├── server.ts         # Server bootstrap
│   │   └── test-mapping.ts   # Backend test script
│   ├── tsconfig.json
│   └── package.json
├── frontend/                 # Next.js (App Router, Tailwind, TypeScript)
│   ├── src/
│   │   ├── app/              # Next.js layout, metadata, pages
│   │   ├── components/       # CSVImporter step components (Upload, Preview, Result)
│   │   ├── lib/              # Client-side custom CSV parser (csv-client.parser.ts)
│   │   └── types/            # Frontend CRM types
│   ├── tsconfig.json
│   └── package.json
└── sample-csvs/              # Standard and unpredictable CSV files for testing
```

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5001
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Fallback Grok API key if you prefer Grok over Gemini
GROK_API_KEY=your_grok_api_key_here
GROK_MODEL=grok-2-1212
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` directory (optional - defaults to `http://localhost:5001`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
```

---

## Running Locally

### Prerequisites
- Node.js (v18 or higher)
- A valid Gemini API Key from Google AI Studio.

### Step 1: Start the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file with your actual `GEMINI_API_KEY`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Express development server:
   ```bash
   npm run dev
   ```
   The backend will be running at `http://localhost:5001`.

### Step 2: Start the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:3000`. Open this URL in your web browser.

---

## Deployment

### Frontend (Vercel)
The Next.js App Router frontend can be deployed directly to Vercel:
1. Connect your repository to Vercel.
2. Set the framework to **Next.js**.
3. In Environment Variables, set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL (e.g. Render or Railway link).
4. Click **Deploy**.

### Backend (Render or Railway)
The backend Node.js server can be deployed on Render or Railway:
1. Create a new Web Service pointing to the backend directory.
2. Build Command: `npm run build` (runs `tsc` compiler).
3. Start Command: `npm start` (runs `node dist/server.js`).
4. Set Environment Variables:
   - `PORT`: e.g. `8080` (or leave default)
   - `GEMINI_API_KEY`: Your live Google Gemini key.

---

## Assumptions & Design Choices

1. **Structured Output Enforcement**: We use the official `@google/genai` unified SDK's `responseSchema` configurations. This guarantees that the response from the model adheres exactly to our TypeScript schema, making CSV row mapping bulletproof.
2. **Batch Processing**: To handle larger CSV uploads and stay within API token constraints, the backend chunks input rows into batches of 20. This prevents model confusion and yields faster response latency.
3. **Contact Rule Filter**: If a mapped row is missing both an email and a phone number, it is skipped. This filtering is performed in Node.js post-AI classification to ensure exact logical correctness.
4. **Client-Side Preview**: CSV parsing for preview uses a light, custom-written RFC 4180-compliant browser parser. It parses commas, quote encapsulations, and handles multi-line fields cleanly without importing large external libraries.

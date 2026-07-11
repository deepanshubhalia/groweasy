'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

import UploadStep from '@/components/CSVImporter/UploadStep';
import PreviewStep from '@/components/CSVImporter/PreviewStep';
import ResultStep from '@/components/CSVImporter/ResultStep';
import { Step, ImportResult } from '@/types/crm';

export default function Home() {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [loadingMsg, setLoadingMsg] = useState<string>('Uploading file...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileLoaded = (loadedFile: File, text: string) => {
    setFile(loadedFile);
    setCsvText(text);
    setStep('PREVIEW');
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCsvText('');
    setStep('UPLOAD');
    setError(null);
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setStep('LOADING');
    setLoadingMsg('Parsing CSV & mapping fields with Gemini AI...');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

    try {
      const response = await fetch(`${backendUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const importResult: ImportResult = await response.json();
      setResult(importResult);
      setStep('RESULT');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'An error occurred while connecting to the AI mapping service.');
      setStep('PREVIEW'); // Allow correcting or retrying from preview
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvText('');
    setResult(null);
    setError(null);
    setStep('UPLOAD');
  };

  const handleCancel = () => {
    handleReset();
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800 font-sans overflow-hidden flex-col">
      
      {/* 1. BRANDED HEADER BAR */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-3 px-8 shrink-0 shadow-xs">
        <div className="bg-gray-900 text-white p-1 rounded-lg font-bold text-xs shrink-0 flex items-center justify-center h-8 w-8">
          🗲
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">GrowEasy</span>
          <span className="text-gray-300 mx-2 text-xs font-light">/</span>
          <span className="text-sm font-semibold text-[#0a8464]">CSV Lead Importer</span>
        </div>
      </header>

      {/* 2. MAIN CSV IMPORTER WORKSPACE */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-8 bg-[#f8fafc] overflow-y-auto">
        
        <div className="bg-white w-full max-w-4xl rounded-2xl border border-gray-100 shadow-lg overflow-hidden flex flex-col max-h-[82vh] animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Import Leads via CSV</h2>
                <p className="text-xs text-gray-500 mt-0.5">Upload a CSV file to bulk import leads into your system.</p>
              </div>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-full transition-all focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Error alerts from API failures */}
            {error && step !== 'LOADING' && (
              <div className="px-6 pt-4">
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Import Error</p>
                    <p className="mt-0.5 text-xs text-red-600 leading-relaxed">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 font-medium text-xs focus:outline-none"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              
              {step === 'UPLOAD' && (
                <UploadStep 
                  onFileLoaded={handleFileLoaded} 
                  onCancel={handleCancel}
                />
              )}

              {step === 'PREVIEW' && (
                <PreviewStep
                  fileName={file?.name || ''}
                  fileSize={file?.size || 0}
                  csvText={csvText}
                  onRemoveFile={handleRemoveFile}
                  onConfirm={handleConfirmImport}
                  onCancel={handleCancel}
                />
              )}

              {step === 'LOADING' && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute h-16 w-16 rounded-full border-4 border-[#0a8464]/10 animate-ping"></div>
                    <div className="bg-[#f0faf7] p-5 rounded-full relative">
                      <Loader2 className="h-10 w-10 text-[#0a8464] animate-spin" />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Processing Mappings</h3>
                  <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{loadingMsg}</p>
                  
                  <div className="mt-8 text-xs text-gray-400 italic">
                    Mapping column definitions to GrowEasy CRM records using Gemini API...
                  </div>
                </div>
              )}

              {step === 'RESULT' && result && (
                <ResultStep 
                  result={result} 
                  onReset={handleReset}
                />
              )}

            </div>

          </div>

      </main>

    </div>
  );
}

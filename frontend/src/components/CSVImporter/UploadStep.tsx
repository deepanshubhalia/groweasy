'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileDown, AlertCircle } from 'lucide-react';

interface UploadStepProps {
  onFileLoaded: (file: File, csvText: string) => void;
  onCancel: () => void;
}

export default function UploadStep({ onFileLoaded, onCancel }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file format. Please upload a valid CSV (.csv) file.');
      return;
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum supported size is 5MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoaded(file, text);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const headers = [
      'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
      'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
      'crm_note', 'data_source', 'possession_time', 'description'
    ].join(',');
    
    const row1 = [
      '2026-07-10 12:00:00', 'John Doe', 'john@example.com', '91', '9876543210',
      'GrowEasy Corp', 'Mumbai', 'Maharashtra', 'India', 'Rahul Dev', 'GOOD_LEAD_FOLLOW_UP',
      'Requires follow up on pricing', 'leads_on_demand', 'Immediate', 'High value potential client'
    ].join(',');

    const row2 = [
      '2026-07-09 15:30:00', 'Jane Smith', 'janesmith@corp.com;jane.s@gmail.com', '1', '4155552671;4155559876',
      'Eden Properties', 'San Francisco', 'California', 'USA', 'Sarah Connor', 'SALE_DONE',
      'Client finalized contract', 'eden_park', '1 month', 'Acquired premium plot'
    ].join(',');

    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${row1}\n${row2}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GrowEasy_CRM_Leads_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Upload Drag & Drop Area */}
      <div 
        className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors duration-200 p-8 ${
          dragActive ? 'border-[#ff9f80] bg-[#fff5f2]' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center text-center max-w-lg">
          <div className="bg-[#f0faf7] p-4 rounded-full mb-4">
            <Upload className="h-8 w-8 text-[#0a8464]" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            Drop your CSV file here
          </h3>
          <p className="text-gray-500 mb-5">
            or <button onClick={onButtonClick} className="text-[#0a8464] font-medium hover:underline focus:outline-none">click to browse files</button>
          </p>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mb-6">
            <AlertCircle className="h-3.5 w-3.5" />
            Supported file: .csv (max 5MB)
          </span>

          <p className="text-xs leading-relaxed text-gray-400 mb-6">
            Required headers: created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note. Template includes default + custom CRM fields to reduce upload errors.
          </p>

          <button
            onClick={downloadTemplate}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#0a8464] text-[#0a8464] font-medium text-sm hover:bg-[#f0faf7] transition-colors focus:outline-none"
          >
            <FileDown className="h-4 w-4" />
            Download Sample CSV Template
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={onCancel}
          type="button"
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors focus:outline-none"
        >
          Cancel
        </button>
        <button
          disabled
          type="button"
          className="px-6 py-2.5 rounded-xl bg-[#ff9f80] text-white font-medium text-sm opacity-50 cursor-not-allowed transition-all"
        >
          Upload File
        </button>
      </div>
    </div>
  );
}

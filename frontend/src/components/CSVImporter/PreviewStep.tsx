'use client';

import React, { useState } from 'react';
import { FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseCSVClient, ClientParsedCSV } from '@/lib/csv-client.parser';

interface PreviewStepProps {
  fileName: string;
  fileSize: number;
  csvText: string;
  onRemoveFile: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PreviewStep({
  fileName,
  fileSize,
  csvText,
  onRemoveFile,
  onConfirm,
  onCancel
}: PreviewStepProps) {
  const parsedData = parseCSVClient(csvText);
  const { headers, rows } = parsedData;

  // Pagination for large preview files
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(rows.length / rowsPerPage);

  const paginatedRows = rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full">
      {/* File Details container */}
      <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-gray-100 rounded-xl mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#e0f2fe] text-[#0284c7] p-2.5 rounded-lg font-bold text-xs flex flex-col items-center justify-center h-10 w-10 shrink-0">
            <FileText className="h-4 w-4" />
            <span className="text-[9px] uppercase font-extrabold tracking-wide mt-0.5">CSV</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm truncate max-w-xs md:max-w-md">
              {fileName}
            </h4>
            <p className="text-gray-400 text-xs mt-0.5">
              {formatFileSize(fileSize)}
            </p>
          </div>
        </div>
        <button
          onClick={onRemoveFile}
          type="button"
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* CSV Table Preview */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-auto border border-gray-100 rounded-xl shadow-inner max-h-[350px]">
          <table className="min-w-full divide-y divide-gray-100 text-left border-collapse table-auto">
            <thead className="bg-[#fafafa] sticky top-0 z-10">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap bg-[#fafafa]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50 text-sm text-gray-700">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                    {headers.map((_, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 whitespace-nowrap text-gray-500 max-w-xs truncate border-b border-gray-50">
                        {row[colIdx] !== undefined ? row[colIdx] : ''}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length || 1} className="px-4 py-12 text-center text-gray-400">
                    No records found in this CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Preview Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 mt-4 text-sm text-gray-500">
            <span>
              Showing <span className="font-medium">{Math.min(rows.length, (currentPage - 1) * rowsPerPage + 1)}</span> to{' '}
              <span className="font-medium">{Math.min(rows.length, currentPage * rowsPerPage)}</span> of{' '}
              <span className="font-medium">{rows.length}</span> entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium text-gray-700 text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
          onClick={onConfirm}
          type="button"
          className="px-6 py-2.5 rounded-xl bg-[#ff825c] hover:bg-[#e06742] text-white font-medium text-sm transition-all focus:outline-none hover:shadow-md cursor-pointer active:scale-[0.98]"
        >
          Confirm Import
        </button>
      </div>
    </div>
  );
}

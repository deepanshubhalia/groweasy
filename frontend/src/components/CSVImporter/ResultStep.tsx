'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { CRMRecord, ImportResult } from '@/types/crm';

interface ResultStepProps {
  result: ImportResult;
  onReset: () => void;
}

export default function ResultStep({ result, onReset }: ResultStepProps) {
  const [activeTab, setActiveTab] = useState<'IMPORTED' | 'SKIPPED'>('IMPORTED');
  const [importedPage, setImportedPage] = useState(1);
  const [skippedPage, setSkippedPage] = useState(1);
  const rowsPerPage = 10;

  const totalImported = result.parsed.length;
  const totalSkipped = result.skipped.length;

  const totalImportedPages = Math.ceil(totalImported / rowsPerPage);
  const totalSkippedPages = Math.ceil(totalSkipped / rowsPerPage);

  const paginatedImported = result.parsed.slice(
    (importedPage - 1) * rowsPerPage,
    importedPage * rowsPerPage
  );

  const paginatedSkipped = result.skipped.slice(
    (skippedPage - 1) * rowsPerPage,
    skippedPage * rowsPerPage
  );

  const renderStatusBadge = (status: CRMRecord['crm_status']) => {
    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e6fcf5] text-[#0ea5e9] border border-[#d3f9ed]">
            Good Lead
          </span>
        );
      case 'SALE_DONE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ebf8ff] text-[#3182ce] border border-[#bee3f8]">
            Sale Done
          </span>
        );
      case 'DID_NOT_CONNECT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
            Did Not Connect
          </span>
        );
      case 'BAD_LEAD':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff5f5] text-[#e53e3e] border border-[#fed7d7]">
            Bad Lead
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-100">
            —
          </span>
        );
    }
  };

  const renderSourceBadge = (source: CRMRecord['data_source']) => {
    if (!source) return <span className="text-gray-400">—</span>;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
        {source.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return <span className="text-gray-400">—</span>;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to trigger JSON download of imported records
  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result.parsed, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'GrowEasy_Mapped_Leads.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-4 p-5 bg-[#f0faf7] border border-[#dcf5ee] rounded-2xl">
          <div className="bg-[#dcf5ee] text-[#0a8464] p-3 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Imported</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalImported}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 bg-[#fff8f6] border border-[#ffece7] rounded-2xl">
          <div className="bg-[#ffece7] text-[#ff6a3d] p-3 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Skipped</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalSkipped}</h3>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center justify-between border-b border-gray-100 mb-5">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('IMPORTED')}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 px-1 transition-all ${
              activeTab === 'IMPORTED'
                ? 'border-[#0a8464] text-[#0a8464]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Imported Leads ({totalImported})
          </button>
          <button
            onClick={() => setActiveTab('SKIPPED')}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 px-1 transition-all ${
              activeTab === 'SKIPPED'
                ? 'border-[#ff6a3d] text-[#ff6a3d]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Skipped Records ({totalSkipped})
          </button>
        </div>

        {activeTab === 'IMPORTED' && totalImported > 0 && (
          <button
            onClick={downloadJSON}
            className="inline-flex items-center gap-1.5 text-[#0a8464] hover:text-[#086b51] font-semibold text-xs border border-[#0a8464]/20 hover:border-[#0a8464]/30 px-3 py-1.5 rounded-lg bg-[#f0faf7] transition-all cursor-pointer focus:outline-none mb-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        {activeTab === 'IMPORTED' ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto border border-gray-100 rounded-xl shadow-inner max-h-[350px] bg-white">
              <table className="min-w-full divide-y divide-gray-100 text-left border-collapse table-auto">
                <thead className="bg-[#fafafa] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Mobile</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Source</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Date Created</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Company</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap">CRM Note</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50 text-sm text-gray-700">
                  {paginatedImported.length > 0 ? (
                    paginatedImported.map((record, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-950 whitespace-nowrap border-b border-gray-50">
                          {record.name || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 border-b border-gray-50">
                          {record.email || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 border-b border-gray-50">
                          {record.mobile_without_country_code ? (
                            `+${record.country_code || '91'} ${record.mobile_without_country_code}`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border-b border-gray-50">
                          {renderStatusBadge(record.crm_status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border-b border-gray-50">
                          {renderSourceBadge(record.data_source)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 border-b border-gray-50">
                          {formatDate(record.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 border-b border-gray-50">
                          {record.company || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 border-b border-gray-50">
                          {[record.city, record.state, record.country].filter(Boolean).join(', ') || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate border-b border-gray-50" title={record.crm_note}>
                          {record.crm_note || <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        No leads were successfully imported.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Imported Pagination */}
            {totalImportedPages > 1 && (
              <div className="flex items-center justify-between px-2 mt-4 text-sm text-gray-500">
                <span>
                  Showing <span className="font-medium">{(importedPage - 1) * rowsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(totalImported, importedPage * rowsPerPage)}</span> of{' '}
                  <span className="font-medium">{totalImported}</span> leads
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportedPage(prev => Math.max(1, prev - 1))}
                    disabled={importedPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-medium text-gray-700 text-xs">
                    Page {importedPage} of {totalImportedPages}
                  </span>
                  <button
                    onClick={() => setImportedPage(prev => Math.min(totalImportedPages, prev + 1))}
                    disabled={importedPage === totalImportedPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto border border-gray-100 rounded-xl shadow-inner max-h-[350px] bg-white">
              <table className="min-w-full divide-y divide-gray-100 text-left border-collapse table-auto">
                <thead className="bg-[#fafafa] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap w-2/5">Record Details</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-[#fafafa] border-b border-gray-100 whitespace-nowrap w-3/5">Skip Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50 text-sm text-gray-700">
                  {paginatedSkipped.length > 0 ? (
                    paginatedSkipped.map((item, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 border-b border-gray-50">
                          <div className="max-w-[320px] overflow-hidden text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded-lg truncate">
                            {JSON.stringify(item.record)}
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-50">
                          <div className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 border border-red-100 px-3 py-1 rounded-lg">
                            {item.reason}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-12 text-center text-gray-400">
                        No skipped records! Everything imported successfully.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Skipped Pagination */}
            {totalSkippedPages > 1 && (
              <div className="flex items-center justify-between px-2 mt-4 text-sm text-gray-500">
                <span>
                  Showing <span className="font-medium">{(skippedPage - 1) * rowsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(totalSkipped, skippedPage * rowsPerPage)}</span> of{' '}
                  <span className="font-medium">{totalSkipped}</span> records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSkippedPage(prev => Math.max(1, prev - 1))}
                    disabled={skippedPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-medium text-gray-700 text-xs">
                    Page {skippedPage} of {totalSkippedPages}
                  </span>
                  <button
                    onClick={() => setSkippedPage(prev => Math.min(totalSkippedPages, prev + 1))}
                    disabled={skippedPage === totalSkippedPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={onReset}
          type="button"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 hover:shadow-md cursor-pointer transition-all active:scale-[0.98] focus:outline-none"
        >
          <RefreshCw className="h-4 w-4 animate-spin-hover" />
          Import Another CSV
        </button>
      </div>
    </div>
  );
}

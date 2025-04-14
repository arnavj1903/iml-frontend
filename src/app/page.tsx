'use client';

import { useState } from 'react';
import UploadForm from '@/components/UploadForm';
import ResultsViewer from '@/components/ResultsViewer';
import ExcelPreview from '@/components/ExcelPreview';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [results, setResults] = useState<any>(null);

  const handleUpload = async (formData: FormData) => {
    try {
      setIsProcessing(true);
      setProcessStatus(null);
      setResults(null);
      
      // Send the formData to the API
      const res = await fetch('/api/process-exam', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      
      if (result.success) {
        setResults(result.result);
        setProcessStatus({
          success: true,
          message: 'Document processed successfully!'
        });
      } else {
        setProcessStatus({
          success: false,
          message: result.message || 'Processing failed. Please try again.'
        });
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessStatus({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!results) return;
    
    try {
      const res = await fetch('/api/download-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(results.excel_data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate Excel file');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exam_results.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Automated Exam Grading</h1>
      
      {/* Status Messages */}
      {processStatus && (
        <div className={`mb-4 p-4 rounded ${processStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {processStatus.message}
        </div>
      )}
      
      {/* Upload Form */}
      {!results && (
        <UploadForm onUpload={handleUpload} />
      )}
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-4 text-center">
          <p>Processing document... Please wait</p>
          {/* Add a spinner here if desired */}
        </div>
      )}
      
      {/* Results Display */}
      {results && (
        <div className="mt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side: Image with detections */}
            <div className="w-full md:w-1/2">
              <h2 className="text-xl font-semibold mb-3">Detection Results</h2>
              <ResultsViewer visualization={results.visualization} />
            </div>
            
            {/* Right side: Excel preview */}
            <div className="w-full md:w-1/2">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Excel Preview</h2>
                <button 
                  onClick={handleDownloadExcel}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Download Excel
                </button>
              </div>
              <ExcelPreview data={results.excel_data} />
            </div>
          </div>
          
          {/* Back button */}
          <button 
            onClick={() => setResults(null)} 
            className="mt-8 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Process Another Document
          </button>
        </div>
      )}
    </main>
  );
}
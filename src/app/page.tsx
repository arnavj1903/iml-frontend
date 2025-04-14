'use client';

import { useEffect, useState } from 'react';
import { ProcessResult, FileWithMetadata } from '../types';
import UploadForm from '@/components/UploadForm';
import ResultsCarousel from '@/components/ResultsCarousel';
import ExcelPreview from '@/components/ExcelPreview';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [processStatus, setProcessStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [remainingFiles, setRemainingFiles] = useState<FileWithMetadata[]>([]);


  const processNextFile = async () => {
    if (remainingFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    const currentFile = remainingFiles[0];
    const formData = new FormData();
    formData.append('file', currentFile);
    
    // Add metadata fields
    Object.entries(remainingFiles[0].metadata || {}).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    try {
      const res = await fetch('/api/process-exam', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResults(prev => [...prev, data.result]);
      } else {
        console.error(`Failed to process ${currentFile.name}:`, data.message);
      }

    } catch (error) {
      console.error(`Error processing ${currentFile.name}:`, error);
    }

    // Remove processed file and continue with next
    setRemainingFiles(prev => prev.slice(1));
    setCurrentFileIndex(prev => prev + 1);
  };

  const handleUpload = async (files: File[], metadata: any) => {
    setIsProcessing(true);
    setProcessStatus(null);
    setResults([]);
    setCurrentFileIndex(0);
    
    // Attach metadata to each file
    const filesWithMetadata = files.map(file => {
      Object.defineProperty(file, 'metadata', {
        value: metadata,
        writable: true
      });
      return file;
    });
    
    setRemainingFiles(filesWithMetadata);
  };

  // Start processing when remainingFiles changes
  useEffect(() => {
    if (isProcessing && remainingFiles.length > 0) {
      processNextFile();
    }
  }, [remainingFiles, isProcessing]);

  const handleDownloadExcel = async () => {
    if (!results.length) return;
    
    // Combine all results into one excel data structure
    const combinedExcelData = {
      metadata: results[0].excel_data.metadata,
      students: results.flatMap(r => r.excel_data.students)
    };

    try {
      const res = await fetch('/api/download-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(combinedExcelData),
      });
      
      if (!res.ok) throw new Error('Failed to generate Excel file');
      
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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Automated Exam Grading System
        </h1>
        
        {/* Status Messages */}
        {processStatus && (
          <div className={`mb-8 p-4 rounded-lg ${
            processStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {processStatus.message}
          </div>
        )}
        
        {/* Upload Form or Processing State */}
        {!results.length && !isProcessing && (
          <div className="mb-8">
            <UploadForm onUpload={handleUpload} />
          </div>
        )}
        
        {/* Processing Progress */}
        {isProcessing && (
          <div className="mb-8">
            <LoadingSpinner 
              message={`Processing file ${currentFileIndex + 1} of ${
                currentFileIndex + remainingFiles.length
              }...`} 
            />
          </div>
        )}
        
        {/* Results Display */}
        {results.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left side: Image carousel with detections */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
                <ResultsCarousel results={results} />
              </div>
              
              {/* Right side: Combined Excel preview */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Excel Preview</h2>
                  <button 
                    onClick={handleDownloadExcel}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Download Excel
                  </button>
                </div>
                <ExcelPreview 
                  data={{
                    metadata: results[0].excel_data.metadata,
                    students: results.flatMap(r => r.excel_data.students)
                  }} 
                />
              </div>
            </div>
            
            {/* Process Another Batch Button */}
            <div className="text-center">
              <button 
                onClick={() => {
                  setResults([]);
                  setProcessStatus(null);
                  setRemainingFiles([]);
                  setCurrentFileIndex(0);
                }} 
                className="bg-gray-100 px-6 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Process Another Batch
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
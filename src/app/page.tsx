'use client';

import { useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import UploadForm from '@/components/UploadForm';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpload = async (formData: FormData) => {
    try {
      setIsUploading(true);
      setUploadStatus(null);
      
      // Send the formData to your backend
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      setUploadStatus({
        success: result.success,
        message: result.success 
          ? 'Document uploaded successfully!' 
          : (result.message || 'Upload failed. Please try again.')
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Answer Script Scanner</title>
        <meta name="description" content="Upload and scan answer scripts" />
      </Head>
      
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Upload Answer Script</h1>
        
        {uploadStatus && (
          <div className={`mb-4 p-4 rounded ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {uploadStatus.message}
          </div>
        )}
        
        <UploadForm onUpload={handleUpload} />
        
        {isUploading && (
          <div className="mt-4 text-center">
            <p>Uploading... Please wait</p>
          </div>
        )}
      </main>
    </>
  );
}
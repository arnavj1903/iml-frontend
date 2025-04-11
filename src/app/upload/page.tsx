'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (formData: FormData) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Send the formData to your backend
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      
      if (result.success) {
        // Navigate to dashboard on successful upload
        router.push('/dashboard');
      } else {
        setError(result.message || 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Load Dynamic Web TWAIN script */}
      <Script 
        src="https://unpkg.com/dwt@18.5.1/dist/dynamsoft.webtwain.min.js" 
        strategy="beforeInteractive"
      />
      
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Upload Answer Script</h1>
          <p className="text-gray-600">Upload or scan student answer scripts</p>
        </header>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        <UploadForm onUpload={handleUpload} />
        
        {isUploading && (
          <div className="mt-6 text-center">
            <p className="text-blue-600">Uploading... Please wait</p>
          </div>
        )}
      </div>
    </>
  );
}
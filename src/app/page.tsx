'use client';

import { useEffect } from 'react';
import UploadForm from '../components/UploadForm';
import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  // Ensure Dynamsoft resources are loaded
  useEffect(() => {
    // Optional: Initialize any global settings for DWT here
  }, []);

  const handleUpload = async (formData: FormData) => {
    try {
      // Send the formData to your backend
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      console.log(result);
      
      if (result.success) {
        alert('Document uploaded successfully!');
      } else {
        alert('Upload failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading document. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Answer Script Scanner</title>
        <meta name="description" content="Upload and scan answer scripts" />
      </Head>
      
      {/* Load Dynamic Web TWAIN script */}
      <Script 
        src="https://unpkg.com/dwt@18.5.1/dist/dynamsoft.webtwain.min.js" 
        strategy="beforeInteractive"
      />
      
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Upload Answer Script</h1>
        <UploadForm onUpload={handleUpload} />
      </main>
    </>
  );
}
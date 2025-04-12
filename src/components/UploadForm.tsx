'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function UploadForm({ onUpload }: { onUpload: (formData: FormData) => void }) {
  const [semester, setSemester] = useState('');
  const [programme, setProgramme] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<any>(null);

  // Initialize jscanify scanner when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && showScanner) {
      // Load jscanify script dynamically
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jscanify@latest/jscanify.min.js';
      script.async = true;
      script.onload = initializeScanner;
      document.body.appendChild(script);

      return () => {
        // Cleanup scanner instance when component unmounts or scanner is hidden
        if (scannerInstance.current) {
          scannerInstance.current.destroy?.();
          scannerInstance.current = null;
        }
        document.body.removeChild(script);
      };
    }
  }, [showScanner]);

  const initializeScanner = () => {
    if (!scannerContainerRef.current || !window.jscanify) return;

    try {
      // Initialize jscanify
      scannerInstance.current = window.jscanify.init({
        container: scannerContainerRef.current,
        onScan: handleScanComplete
      });
    } catch (error) {
      console.error('Error initializing scanner:', error);
      alert('Failed to initialize scanner. Please try again.');
    }
  };

  const handleScanComplete = (result: any) => {
    if (result && result.image) {
      // Convert data URL to File object
      fetch(result.image)
        .then(res => res.blob())
        .then(blob => {
          const timestamp = new Date().getTime();
          const fileName = `scan_${timestamp}.png`;
          const scannedFile = new File([blob], fileName, { type: 'image/png' });
          
          setFile(scannedFile);
          setPreviewUrl(result.image);
          
          alert('Document scanned successfully!');
        })
        .catch(err => {
          console.error('Error converting scan to file:', err);
          alert('Failed to process scanned document.');
        });
    } else {
      alert('Scan failed or was cancelled.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Create preview URL for the selected file
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please upload or scan an image');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', semester);
    formData.append('programme', programme);
    formData.append('course', course);
    formData.append('section', section);

    onUpload(formData);
  };

  const startScan = () => {
    if (scannerInstance.current) {
      scannerInstance.current.startScan();
    } else {
      alert('Scanner not initialized. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-4 border rounded-xl shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <select value={semester} onChange={(e) => setSemester(e.target.value)} required className="border p-2 rounded">
            <option value="">Select Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </select>

          <select value={programme} onChange={(e) => setProgramme(e.target.value)} required className="border p-2 rounded">
            <option value="">Select Programme</option>
            <option value="BCA">BCA</option>
            <option value="BSc">B.Sc</option>
            <option value="BTech">B.Tech</option>
          </select>

          <select value={course} onChange={(e) => setCourse(e.target.value)} required className="border p-2 rounded col-span-2">
            <option value="">Select Course</option>
            {(() => {
              const courses = [];
              if (semester && programme) {
                const year = Math.ceil(Number(semester) / 2);
                const programmeCode = programme === 'BTech' ? '1' : programme === 'BSc' ? '2' : '3';
                const semesterCode = semester;
                for (let i = 0; i < 10; i++) {
                  courses.push(`CS${year}${semesterCode}${programmeCode}${i}`);
                }
              }
              return courses.map((courseCode) => (
                <option key={courseCode} value={courseCode}>
                  {courseCode}
                </option>
              ));
            })()}
          </select>

          <select value={section} onChange={(e) => setSection(e.target.value)} required className="border p-2 rounded">
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
            <option value="H">H</option>
            <option value="I">I</option>
          </select>

          <div className="col-span-2 flex flex-col space-y-2">
            <div className="flex space-x-2">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={() => setShowScanner(!showScanner)}
                className="whitespace-nowrap"
              >
                {showScanner ? 'Hide Scanner' : 'Use Scanner'}
              </Button>
            </div>
            
            {previewUrl && (
              <div className="mt-2 border rounded p-2">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-40 mx-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
        
        <Button type="submit" className="w-full">Upload</Button>
      </form>

      {showScanner && (
        <div className="space-y-4">
          <div 
            ref={scannerContainerRef} 
            className="h-64 border rounded bg-gray-100"
          ></div>
          
          <Button onClick={startScan} className="w-full">Scan Document</Button>
        </div>
      )}
    </div>
  );
}

// Add type declaration for jscanify
declare global {
  interface Window {
    jscanify: {
      init: (options: {
        container: HTMLElement;
        onScan: (result: any) => void;
      }) => {
        startScan: () => void;
        destroy?: () => void;
      };
    };
  }
}
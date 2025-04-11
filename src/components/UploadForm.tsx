'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import Dynamsoft from "dwt";
import { WebTwain } from 'dwt/dist/types/WebTwain';

// Import DWT component with dynamic import to avoid SSR issues
const DWT = dynamic(() => import('./DWT'), {
  ssr: false,
  loading: () => <p>Initializing Document Scanner...</p>,
});

// Define types for Dynamsoft
interface DynamsoftDWT {
  EnumDWT_ImageType: {
    IT_PDF: number;
  };
}

interface DynamsoftNamespace {
  DWT: DynamsoftDWT;
}

declare global {
  interface Window {
    Dynamsoft: DynamsoftNamespace;
  }
}

export default function UploadForm({ onUpload }: { onUpload: (formData: FormData) => void }) {
  const [semester, setSemester] = useState('');
  const [programme, setProgramme] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const DWObject = useRef<WebTwain | null>(null);

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

  const onWebTWAINReady = (dwt: WebTwain) => {
    DWObject.current = dwt;
  };

  const handleScan = () => {
    if (DWObject.current) {
      DWObject.current.SelectSource(
        function () {
          DWObject.current!.OpenSource();
          DWObject.current!.AcquireImage();
        },
        function () {
          console.log("SelectSource failed!");
        }
      );
    }
  };

  const handleSave = async () => {
    if (DWObject.current && DWObject.current.HowManyImagesInBuffer > 0 && typeof window !== 'undefined' && window.Dynamsoft) {
      try {
        // Create a timestamp for the filename
        const timestamp = new Date().getTime();
        const filename = `scan_${timestamp}.pdf`;
        
        // Convert the scanned image to a Blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          DWObject.current!.ConvertToBlob(
            [0],  // Convert the first image
            window.Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
            function(blob) {
              resolve(blob);
            },
            function(errorCode, errorString) {
              reject(new Error(errorString));
            }
          );
        });
        
        // Create a File object from the Blob
        const scannedFile = new File([blob], filename, { type: 'application/pdf' });
        setFile(scannedFile);
        
        alert('Document scanned and ready for upload!');
      } catch (error) {
        console.error('Error saving scan:', error);
        alert('Failed to save scan. Please try again.');
      }
    } else {
      alert('No image to save. Please scan a document first.');
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

          <div className="col-span-2 flex space-x-2">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
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
        </div>
        
        <Button type="submit" className="w-full">Upload</Button>
      </form>

      {showScanner && (
        <div className="space-y-4">
          <div className="h-64 border rounded">
            <DWT
              width="100%"
              height="100%"
              viewMode={{ cols: 1, rows: 1 }}
              onWebTWAINReady={onWebTWAINReady}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleScan} className="flex-1">Scan Document</Button>
            <Button onClick={handleSave} className="flex-1">Save Scan</Button>
          </div>
        </div>
      )}
    </div>
  );
}
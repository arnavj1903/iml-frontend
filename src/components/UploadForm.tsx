'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function UploadForm({ onUpload }: { onUpload: (files: File[], metadata: any) => void }) {
  const [semester, setSemester] = useState('');
  const [programme, setProgramme] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length == 0) return alert('Please upload atleast one image');

    const metadata = {
      semester,
      programme,
      course,
      section
    };

    onUpload(files, metadata);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto p-4 border rounded-xl shadow-lg">
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

        <div className="space-y-2">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
          {files.length > 0 && (
            <div className="text-sm text-gray-600">
              {files.length} file(s) selected
            </div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full">
        Process {files.length} File{files.length !== 1 ? 's' : ''}
      </Button>
    </form>
  );
}
// src/app/api/download-excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data || !data.students) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to a format suitable for XLSX
    const excelData = formatExcelData(data);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Results');
    
    // Generate XLSX file
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Return the Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="exam_results.xlsx"'
      }
    });
    
  } catch (error: any) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({
      error: error.message || 'An error occurred generating the Excel file'
    }, { status: 500 });
  }
}

function formatExcelData(data: any): any[][] {
  // Create header row
  const headers = ['USN'];
  
  // Add question headers
  for (let q = 1; q <= 10; q++) {
    for (let sub of 'abcde') {
      headers.push(`Q${q}${sub}`);
    }
  }
  
  headers.push('Total');
  
  // Create rows
  const rows = [headers];
  
  // Add student data
  data.students.forEach((student: any) => {
    const row = [student.usn];
    
    // Add question marks
    for (let q = 1; q <= 10; q++) {
      for (let sub of 'abcde') {
        const qKey = `q${q}`;
        const mark = student.questions[qKey]?.[sub] || '';
        row.push(mark);
      }
    }
    
    row.push(student.total_marks);
    rows.push(row);
  });
  
  // Add metadata at the bottom
  rows.push([]);
  rows.push(['Exam Details:']);
  rows.push(['Semester', data.metadata.semester]);
  rows.push(['Programme', data.metadata.programme]);
  rows.push(['Course', data.metadata.course]);
  rows.push(['Section', data.metadata.section]);
  
  return rows;
}
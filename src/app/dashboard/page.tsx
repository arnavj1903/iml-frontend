import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is where you would fetch files from your database or storage
    // For now, we'll return mock data
    const mockFiles = [
      {
        id: '1',
        filename: 'answer_script_1.pdf',
        timestamp: new Date().toISOString(),
        semester: '3',
        programme: 'BCA',
        course: 'CS2311',
        section: 'A'
      },
      {
        id: '2',
        filename: 'answer_script_2.pdf',
        timestamp: new Date().toISOString(),
        semester: '5',
        programme: 'BTech',
        course: 'CS3512',
        section: 'B'
      }
    ];
    
    return NextResponse.json({ 
      success: true,
      files: mockFiles
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
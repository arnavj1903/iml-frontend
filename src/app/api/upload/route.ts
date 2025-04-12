import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const file = formData.get('file') as File;
    const semester = formData.get('semester') as string;
    const programme = formData.get('programme') as string;
    const course = formData.get('course') as string;
    const section = formData.get('section') as string;
    
    // Log the received data (you can process it as needed)
    console.log({
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      semester,
      programme,
      course,
      section
    });
    
    // Here you would typically:
    // 1. Save the file to a storage service (S3, Firebase, etc.)
    // 2. Save metadata to your database
    // 3. Process the scanned document if needed
    
    // For demonstration, we're just returning success
    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
// src/app/api/get-processed-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const imagePath = url.searchParams.get('path');
    
    if (!imagePath) {
      return NextResponse.json({ error: 'No image path provided' }, { status: 400 });
    }
    
    // Security check: ensure the path is within the public directory
    const sanitizedPath = path.normalize(imagePath).replace(/^\/+/, '');
    const fullPath = path.join(process.cwd(), 'public', sanitizedPath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.error(`File not found: ${fullPath}`);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Read the file
    const fileBuffer = await fs.readFile(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'image/jpeg'; // Default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    
    // Return the image
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      }
    });
    
  } catch (error: any) {
    console.error('Error serving image:', error);
    return NextResponse.json({
      error: error.message || 'An error occurred serving the image'
    }, { status: 500 });
  }
}
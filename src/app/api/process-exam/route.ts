// src/app/api/process-exam/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const PROCESSED_DIR = path.join(process.cwd(), 'public', 'processed_images');

// Create directories if they don't exist
async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(PROCESSED_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectoriesExist();
    
    // Process form data
    const formData = await request.formData();
    
    // Extract form fields
    const file = formData.get('file') as File;
    const semester = formData.get('semester') as string;
    const programme = formData.get('programme') as string;
    const course = formData.get('course') as string;
    const section = formData.get('section') as string;
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    
    // Save the uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    
    // Create metadata
    const metadata = {
      semester,
      programme,
      course, 
      section
    };
    
    // Run the Python script
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 'integrated_exam_processor.py');
    const scriptResult = await runPythonScript(pythonScriptPath, filePath, metadata);
    
    // Parse the result
    const result = JSON.parse(scriptResult);
    
    // Move processed image to public directory for client access
    if (result.processed_image_path) {
      const originalPath = result.processed_image_path;
      const publicPath = path.join(PROCESSED_DIR, path.basename(originalPath));
      
      try {
        // Check if the file exists before trying to move it
        await fs.access(originalPath);
        await fs.copyFile(originalPath, publicPath);
        
        // Update the path to be relative to public for client access
        result.processed_image_path = `/processed_images/${path.basename(originalPath)}`;
      } catch (error) {
        console.error('Error moving processed image:', error);
      }
    }
    
    // Create visualization data
    const visualization = {
      image_path: result.processed_image_path,
      detections: result.detections || []
    };
    
    // Format data for the response
    const responseData = {
      success: true,
      result: {
        visualization,
        excel_data: result.excel_data || {
          metadata,
          students: []
        },
        programme_verification: result.programme_verification || {
          match: true,
          detected: programme,
          selected: programme
        }
      }
    };
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Error processing exam:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An error occurred during processing'
    }, { status: 500 });
  }
}

// Helper function to run the Python script
function runPythonScript(scriptPath: string, imagePath: string, metadata: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const metadataJson = JSON.stringify(metadata).replace(/"/g, '\\"'); // Escape double quotes for command line
    
    // Use python or python3 depending on your system
    const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';
    
    // For Windows, we need to be more careful with quotes and escaping
    let command;
    if (os.platform() === 'win32') {
      // For Windows, wrap the JSON in double quotes and escape inner double quotes
      command = `${pythonCommand} "${scriptPath}" "${imagePath}" "${metadataJson}"`;
    } else {
      // For Unix-like systems, use single quotes around JSON
      command = `${pythonCommand} "${scriptPath}" "${imagePath}" '${metadataJson}'`;
    }
    
    console.log('Executing command:', command); // Log the command for debugging
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        console.error(`Stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`Script warnings: ${stderr}`);
      }
      
      resolve(stdout);
    });
  });
}
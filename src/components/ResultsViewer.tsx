'use client';

import { useEffect, useRef } from 'react';

interface Detection {
  class: string;
  coordinates: [number, number, number, number];
  confidence: number;
  recognized_value: string;
}

interface VisualizationData {
  image_path: string;
  detections: Detection[];
}

interface ResultsViewerProps {
  visualization: VisualizationData;
}

export default function ResultsViewer({ visualization }: ResultsViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Class colors map
  const getColorForClass = (className: string) => {
    // Generate a color based on class name
    const classMap: Record<string, string> = {
      'usn': '#FF0000',        // Red
      'totalMarks': '#00FF00', // Green
      'm1': '#0000FF',         // Blue
      'm2': '#FFA500',         // Orange
      'm3': '#800080',         // Purple
      'm4': '#FFC0CB',         // Pink
      'm5': '#00FFFF',         // Cyan
      'm6': '#FFD700',         // Gold
      'm7': '#008000',         // Dark Green
      'm8': '#808080',         // Gray
      'm9': '#8B4513',         // Brown
      'm10': '#FF00FF',        // Magenta
    };

    // For subquestions (e.g., m1a, m1b, etc.), use a lighter shade of the main question color
    if (className.length > 2) {
      const mainClass = className.substring(0, 2);
      const mainColor = classMap[mainClass] || '#000000';
      // Make it slightly transparent/lighter
      return mainColor + '80';  // 80 is 50% opacity in hex
    }

    return classMap[className] || '#000000';  // Default to black
  };

  useEffect(() => {
    // This effect handles drawing the image and bounding boxes

    const image = imgRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas || !visualization) return;

    // Set up image onload handler
    image.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // // Draw bounding boxes
      // visualization.detections.forEach(detection => {
      //   const [x1, y1, x2, y2] = detection.coordinates;
      //   const width = x2 - x1;
      //   const height = y2 - y1;

      //   // Get color for this class
      //   const color = getColorForClass(detection.class);

      //   // Draw rectangle
      //   ctx.strokeStyle = color;
      //   ctx.lineWidth = 2;
      //   ctx.strokeRect(x1, y1, width, height);

      //   // Draw label background
      //   ctx.fillStyle = color;
      //   const label = `${detection.class}: ${detection.recognized_value}`;
      //   const textWidth = ctx.measureText(label).width;
      //   ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);

      //   // Draw label text
      //   ctx.fillStyle = '#FFFFFF';
      //   ctx.font = '14px Arial';
      //   ctx.fillText(label, x1 + 5, y1 - 5);
      // });
    };

    // Set image source - we're using a data URL for demo
    // In production, you'd use a proper URL to the processed image
    if (visualization.image_path) {
      image.src = `/api/get-processed-image?path=${encodeURIComponent(visualization.image_path)}`;
    }


  }, [visualization]);

  const uniqueClasses = Array.from(new Set(visualization.detections.map(d => d.class)));

  return (
    <div className="relative border rounded overflow-hidden">
      {/* Hidden image element that loads the source */}
      <img
        ref={imgRef}
        className="hidden"
        alt="Source"
        onError={() => console.error('Failed to load image')}
      />

      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
      ></canvas>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {uniqueClasses.map(className => (
          <div key={className} className="flex items-center">
            <div
              className="w-4 h-4 mr-2"
              style={{ backgroundColor: getColorForClass(className) }}
            ></div>
            <span className="text-sm">{className}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
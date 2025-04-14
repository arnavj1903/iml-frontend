'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // For subquestions (e.g., 1a, 1b, etc.)
    if (className.length >= 2 && className[0].match(/\d/) && className[1].match(/[a-e]/)) {
      const qNum = className[0];
      return classMap[`m${qNum}`] || '#4B0082'; // Use question color or default indigo
    }

    return classMap[className] || '#4B0082'; // Default to indigo
  };

  // Draw boxes on canvas
  const drawDetections = () => {
    const canvas = canvasRef.current;
    const image = imgRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    if (visualization.detections && visualization.detections.length > 0) {
      visualization.detections.forEach(detection => {
        const [x1, y1, x2, y2] = detection.coordinates;
        const width = x2 - x1;
        const height = y2 - y1;

        // Get color for this class
        const color = getColorForClass(detection.class);

        // Draw rectangle
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);

        // Draw label background
        ctx.fillStyle = color;
        const label = `${detection.class}: ${detection.recognized_value}`;
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        ctx.fillRect(x1, y1 - 25, textWidth + 10, 20);

        // Draw label text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText(label, x1 + 5, y1 - 10);
      });
    }
  };

  useEffect(() => {
    // This effect handles loading the image
    const image = imgRef.current;
    if (!image || !visualization.image_path) return;

    const handleLoad = () => {
      setImageLoaded(true);
      setError(null);
    };

    const handleError = () => {
      setImageLoaded(false);
      setError(`Failed to load image: ${visualization.image_path}`);
    };

    // Set up event handlers
    image.onload = handleLoad;
    image.onerror = handleError;

    // Set image source
    image.src = visualization.image_path.startsWith('/')
      ? visualization.image_path
      : `/api/get-processed-image?path=${encodeURIComponent(visualization.image_path)}`;

    // Clean up event handlers
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [visualization.image_path]);

  // Effect for drawing detections after image loads
  useEffect(() => {
    if (imageLoaded) {
      drawDetections();
    }
  }, [imageLoaded, visualization.detections]);

  // Get unique classes for legend
  const uniqueClasses = Array.from(
    new Set(visualization.detections?.map(d => d.class) || [])
  );

  return (
    <div className="relative border rounded overflow-hidden bg-white">
      {/* Hidden image element that loads the source */}
      <img
        ref={imgRef}
        className="hidden"
        alt="Source"
      />

      {/* Error message */}
      {error && (
        <div className="p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
      ></canvas>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded">
        <h3 className="col-span-3 font-medium">Detection Legend:</h3>
        {uniqueClasses.map(className => (
          <div key={className} className="flex items-center">
            <div
              className="w-4 h-4 mr-2 rounded"
              style={{ backgroundColor: getColorForClass(className) }}
            ></div>
            <span className="text-sm">{className}</span>
          </div>
        ))}
      </div>
      
      {/* Detection counts */}
      <div className="mt-2 p-2 bg-gray-50 rounded">
        <p className="text-sm">Total detections: {visualization.detections?.length || 0}</p>
      </div>
    </div>
  );
}
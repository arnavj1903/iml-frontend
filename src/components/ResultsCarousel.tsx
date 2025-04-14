'use client';

import { useState } from 'react';
import ResultsViewer from './ResultsViewer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResultsCarouselProps {
  results: Array<{
    visualization: {
      image_path: string;
      detections: Array<any>;
    };
  }>;
}

export default function ResultsCarousel({ results }: ResultsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((current) => 
      current === 0 ? results.length - 1 : current - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((current) => 
      current === results.length - 1 ? 0 : current + 1
    );
  };

  if (!results.length) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <ResultsViewer visualization={results[currentIndex].visualization} />
      </div>

      {results.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-r text-white hover:bg-black/75"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-l text-white hover:bg-black/75"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {results.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
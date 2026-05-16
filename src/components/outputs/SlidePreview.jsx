import React from 'react';

const SlidePreview = ({ slideData }) => {
  if (!slideData || !slideData.slides) return null;

  return (
    <div className="w-full h-full bg-lumiere-bg-secondary flex flex-col items-center justify-center border-lumiere-border border rounded-xl p-6 overflow-y-auto">
      <h3 className="text-xl font-semibold mb-6">Bản trình bày mẫu</h3>
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        {slideData.slides.map((slide, i) => (
          <div key={i} className="bg-lumiere-bg-primary rounded-xl p-8 border border-lumiere-border shadow-sm aspect-video flex flex-col justify-center relative">
            <span className="absolute top-4 left-4 text-xs font-mono text-lumiere-text-tertiary">Slide {i + 1}</span>
            <h4 className="text-2xl font-bold text-center mb-6 text-lumiere-text-primary">{slide.title}</h4>
            <ul className="list-disc list-inside space-y-3 text-lumiere-text-secondary text-lg px-8">
              {slide.bulletPoints && slide.bulletPoints.map((point, ptIdx) => (
                <li key={ptIdx}>{point}</li>
              ))}
            </ul>
            {slide.speakerNotes && (
              <div className="absolute bottom-4 left-4 right-4 bg-yellow-500/10 text-yellow-600 text-xs p-3 rounded-lg border border-yellow-500/20">
                <strong>Speaker Notes:</strong> {slide.speakerNotes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlidePreview;

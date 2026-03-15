import React from 'react';

interface ImportedSVGProps {
  svgXml: string;
  isFlotr: boolean;
}

const ImportedSVG: React.FC<ImportedSVGProps> = ({ svgXml, isFlotr }) => {
  if (!svgXml || isFlotr) return null;
  return (
    <g id="imported-svg" pointerEvents="none">
      <g dangerouslySetInnerHTML={{ __html: svgXml }} />
    </g>
  );
};

export default ImportedSVG;


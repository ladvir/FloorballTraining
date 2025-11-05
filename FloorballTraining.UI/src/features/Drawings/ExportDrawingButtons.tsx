import React from "react";

interface ExportDrawingButtonsProps {
    svgRef: React.RefObject<SVGSVGElement> | null;
}

const ExportDrawingButtons: React.FC<ExportDrawingButtonsProps> = ({ svgRef }) => {
    const handleExportSvg = () => {
        if (!svgRef) return;
        
        const svg = svgRef.current;
        if (!svg) return;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        if (!source.startsWith('<?xml')) {
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        }
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportPng = () => {
        if (!svgRef) return;
        const svg = svgRef.current;
        if (!svg) return;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        const img = new window.Image();
        const svg64 = btoa(decodeURIComponent(encodeURIComponent(source)));
        const image64 = 'data:image/svg+xml;base64,' + svg64;
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = svg.width.baseVal.value || 800;
            canvas.height = svg.height.baseVal.value || 600;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(function (blob) {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'drawing.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.src = image64;
    };

    return (
        <div className={"tool-group"}>
            <div className="tool-group">
                <div className="tool-item">
                    <button onClick={handleExportPng} title="Exportovat do PNG">
                        <svg width={32} height={32} viewBox="0 0 256 256" fill="none"><path fill="#000000" d="M60 148H44a4 4 0 0 0-4 4v56a4 4 0 0 0 8 0v-12h12a24 24 0 0 0 0-48Zm0 40H48v-32h12a16 16 0 0 1 0 32Zm160 12.87a4 4 0 0 1-1.11 2.77A26.11 26.11 0 0 1 200 212c-15.44 0-28-14.36-28-32s12.56-32 28-32a25.41 25.41 0 0 1 14.24 4.43a4 4 0 1 1-4.48 6.63A17.45 17.45 0 0 0 200 156c-11 0-20 10.77-20 24s9 24 20 24a17.87 17.87 0 0 0 12-4.82V188h-4a4 4 0 0 1 0-8h8a4 4 0 0 1 4 4ZM152 152v56a4 4 0 0 1-2.78 3.81a3.93 3.93 0 0 1-1.22.19a4 4 0 0 1-3.25-1.67L112 164.48V208a4 4 0 0 1-8 0v-56a4 4 0 0 1 7.25-2.33L144 195.52V152a4 4 0 0 1 8 0Zm52-40a4 4 0 0 0 8 0V88a4 4 0 0 0-1.17-2.83l-56-56A4 4 0 0 0 152 28H56a12 12 0 0 0-12 12v72a4 4 0 0 0 8 0V40a4 4 0 0 1 4-4h92v52a4 4 0 0 0 4 4h52Zm-48-28V41.65L198.34 84Z"/></svg>
                    </button>
                    <span>Export PNG</span>
                </div>
                <div className="tool-item">
                    <button onClick={handleExportSvg} title="Exportovat do SVG">
                        <svg width={32} height={32} viewBox="0 0 256 256" fill="none"><path fill="#000000" d="m210.83 85.17l-56-56A4 4 0 0 0 152 28H56a12 12 0 0 0-12 12v72a4 4 0 1 0 8 0V40a4 4 0 0 1 4-4h92v52a4 4 0 0 0 4 4h52v20a4 4 0 0 0 8 0V88a4 4 0 0 0-1.17-2.83ZM156 41.65L198.34 84H156ZM83.85 195.8a17 17 0 0 1-7.43 12.41C72 211.12 66.38 212 61.2 212a57.89 57.89 0 0 1-14.2-1.89a4 4 0 1 1 2.15-7.7c4.22 1.17 16.56 3.29 22.83-.88a8.94 8.94 0 0 0 3.91-6.75c.83-6.45-4.38-8.69-15.64-11.94c-9.68-2.8-21.72-6.28-20.14-18.77a16.66 16.66 0 0 1 7.22-12.13c4.56-3.07 11-4.36 19.1-3.82a61.11 61.11 0 0 1 10.47 1.61a4 4 0 0 1-2 7.74c-4.29-1.13-16.81-3.12-23.06 1.11a8.51 8.51 0 0 0-3.75 6.49c-.66 5.17 3.89 7 14.42 10.08c9.76 2.85 23.14 6.69 21.34 20.65Zm63.92-42.45l-20 56a4 4 0 0 1-7.53 0l-20-56a4 4 0 1 1 7.53-2.7L124 196.11l16.23-45.46a4 4 0 1 1 7.53 2.7ZM212 184v16.87a4 4 0 0 1-1.11 2.77A26.11 26.11 0 0 1 192 212c-15.44 0-28-14.36-28-32s12.56-32 28-32a25.41 25.41 0 0 1 14.24 4.43a4 4 0 1 1-4.48 6.63A17.43 17.43 0 0 0 192 156c-11 0-20 10.77-20 24s9 24 20 24a17.87 17.87 0 0 0 12-4.82V188h-4a4 4 0 0 1 0-8h8a4 4 0 0 1 4 4Z"/></svg>
                    </button>
                    <span>Export SVG</span>
                </div>
            </div>

        </div>    
    );
};

export default ExportDrawingButtons;

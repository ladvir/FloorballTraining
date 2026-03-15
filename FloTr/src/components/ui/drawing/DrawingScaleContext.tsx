import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface DrawingScaleContextType {
    scaleFactor: number;
    baseWidth: number;
    baseHeight: number;
}

const DrawingScaleContext = createContext<DrawingScaleContextType>({
    scaleFactor: 1,
    baseWidth: 800,
    baseHeight: 600
});

export const useDrawingScale = () => useContext(DrawingScaleContext);

interface DrawingScaleProviderProps {
    children: ReactNode;
    viewBoxWidth: number;
    viewBoxHeight: number;
}

export const DrawingScaleProvider: React.FC<DrawingScaleProviderProps> = ({ 
    children, 
    viewBoxWidth, 
    viewBoxHeight 
}) => {
    const [scaleFactor, setScaleFactor] = useState(1);

    useEffect(() => {
        // Vypočítáme scale factor na základě velikosti viewportu
        // Referenční šířka je 600px (nový DEFAULT_WIDTH)
        // Pro menší obrazovky škálujeme dolů
        const calculateScaleFactor = () => {
            const screenWidth = window.innerWidth;
            
            // Dostupná šířka pro drawing area (odpovídá CSS clamp)
            const minWidth = 300;
            const maxWidth = 800;
            const availableWidth = Math.max(minWidth, Math.min(screenWidth * 0.9, maxWidth));
            
            // Referenční šířka pro desktop je 600px
            const referenceWidth = 600;
            
            // Scale factor je poměr dostupné šířky k referenční šířce
            // Pro desktop (1555px+ šířky obrazovky) bude scale = 1400/600 = 2.33
            // Pro tablet (768px) bude scale = 691/600 = 1.15
            // Pro mobil (375px) bude scale = 337.5/600 = 0.56
            const scale = availableWidth / referenceWidth;
           
            // Omezíme scale na rozumné hodnoty
            // Min 0.5 (50%) pro velmi malé displeje
            // Max 2.5 (250%) pro velké displeje
            return Math.max(0.5, Math.min(scale, 2.3));
        };

        const updateScale = () => {
            setScaleFactor(calculateScaleFactor());
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        
        return () => window.removeEventListener('resize', updateScale);
    }, [viewBoxWidth, viewBoxHeight]);

    return (
        <DrawingScaleContext.Provider value={{ 
            scaleFactor, 
            baseWidth: viewBoxWidth, 
            baseHeight: viewBoxHeight 
        }}>
            {children}
        </DrawingScaleContext.Provider>
    );
};



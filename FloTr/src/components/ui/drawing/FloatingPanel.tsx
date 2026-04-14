import React, { useRef, useState, useCallback } from 'react';

interface FloatingPanelProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
    initialPosition?: { x: number; y: number };
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ title, children, onClose, initialPosition }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: initialPosition?.x ?? 0, y: initialPosition?.y ?? 0 });
    const dragging = useRef(false);
    const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        dragging.current = true;
        dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        e.preventDefault();

        const handleMouseMove = (ev: MouseEvent) => {
            if (!dragging.current) return;
            setOffset({ x: ev.clientX - dragStart.current.x, y: ev.clientY - dragStart.current.y });
        };
        const handleMouseUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [offset]);

    return (
        <div
            ref={panelRef}
            className="floating-panel"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        >
            <div className="floating-panel-header" onMouseDown={handleMouseDown}>
                <span>{title}</span>
                {onClose && <button className="floating-panel-close" onClick={onClose}>&times;</button>}
            </div>
            <div className="floating-panel-body">
                {children}
            </div>
        </div>
    );
};

export default FloatingPanel;

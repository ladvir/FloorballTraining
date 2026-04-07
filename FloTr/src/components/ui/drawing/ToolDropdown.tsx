import React, { useState, useRef, useEffect } from 'react';

interface ToolDropdownProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    children: React.ReactNode;
}

const ToolDropdown: React.FC<ToolDropdownProps> = ({ label, icon, isActive, children }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="tool-dropdown" ref={ref}>
            <button
                className={`tool-dropdown-trigger${isActive ? ' active' : ''}`}
                onClick={() => setOpen(!open)}
                title={label}
            >
                <div className="tool-dropdown-icon">{icon}</div>
                <span className="tool-dropdown-label">{label}</span>
                <svg className="tool-dropdown-chevron" width={12} height={12} viewBox="0 0 12 12">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {open && (
                <div className="tool-dropdown-menu">
                    <div onClick={() => setOpen(false)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolDropdown;

import React from "react";
import { getFieldOptionSvgMarkup } from './utils/fieldSvgUtils';
import { type FieldOption } from './fieldConstants';

export { DEFAULT_WIDTH, DEFAULT_HEIGHT, FieldOptions, type FieldOption } from './fieldConstants';

interface FieldSelectorProps {
    options: FieldOption[];
    selectedId: string;
    onChange: (id: string) => void;
}

const FieldSelector: React.FC<FieldSelectorProps> = ({ options, selectedId, onChange }) => {
    return (
        <div className="tool-group">
            {options.map(opt => (
                <div key={opt.id} className="tool-item">
                    <button
                        className={selectedId === opt.id ? 'selected' : ''}
                        onClick={() => onChange(opt.id)}
                        title={opt.label}
                    >
                        <span
                            className="field-option-icon"
                            dangerouslySetInnerHTML={{
                                __html: getFieldOptionSvgMarkup(opt, options)
                                    ? `<svg width='32' height='32' viewBox='0 0 ${opt.width} ${opt.height}'>${getFieldOptionSvgMarkup(opt, options)}</svg>`
                                    : `<svg width='32' height='32' viewBox='0 0 ${opt.width} ${opt.height}'/>`
                            }}
                        />
                    </button>
                    <span>{opt.label}</span>
                </div>
            ))}
        </div>
    );
};

export default FieldSelector;

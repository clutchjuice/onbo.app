import React from "react";
import { X } from "lucide-react";

interface ColorFieldProps {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
  showReset?: boolean;
}

export const ColorField: React.FC<ColorFieldProps> = ({ label, value, defaultValue, onChange, showReset = true }) => {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow valid hex
    if (/^#([0-9A-Fa-f]{0,6})$/.test(val)) {
      onChange(val);
    }
  };
  const handleReset = () => {
    onChange(defaultValue);
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {showReset && (
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto p-1 rounded hover:bg-muted transition-colors"
            aria-label={`Reset ${label} color`}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={handleColorChange}
          className="w-8 h-8 rounded border border-input shadow-sm cursor-pointer"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={handleHexChange}
          maxLength={7}
          className="w-28 px-2 py-1 border rounded text-sm font-mono bg-background"
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}; 
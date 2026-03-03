import React, { } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
}

export const NumberInput = ({
    value,
    onChange,
    min = 0,
    max = 1000,
    step = 1,
    className,
    disabled = false,
    name,
    id,
}: NumberInputProps) => {
    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!disabled && value > min) {
            onChange(Math.max(min, value - step));
        }
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!disabled && value < max) {
            onChange(Math.min(max, value + step));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
            onChange(newValue);
        } else if (e.target.value === '') {
            // Optional: Handle empty input if needed, but for controlled number input, usually keep it valid
            // For now, let's just not update or set to min
        }
    };

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <button
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
            >
                <Minus className="w-4 h-4" />
            </button>
            <div className="relative">
                <input
                    type="number"
                    name={name}
                    id={id}
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    className="w-16 text-center bg-transparent border-none text-white font-semibold focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    disabled={disabled}
                />
            </div>
            <button
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
};

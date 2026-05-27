import { type ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'custom';
    customColor?: string;
}

export function Button({ children, variant = 'primary', customColor, style, ...props }: ButtonProps) {
    return (
        <button
            className={`btn btn-${variant}`}
            style={variant === 'custom' && customColor ? { backgroundColor: customColor, color: '#fff', ...style } : style}
            {...props}
        >
            {children}
        </button>
    );
}
import { type ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger';
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
    return (
        <button
            className={`btn btn-${variant}`}
            {...props}
        >
            {children}
        </button>
    );
}
import { type InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, ...props }: InputProps) {
    return (
        <div className="input-container">
            {label && <label className="input-label">{label}</label>}
            <input
                className="input-field"
                {...props}
            />
        </div>
    );
}
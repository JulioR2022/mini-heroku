import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error';

interface ToastContextData {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('success');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string, t: ToastType) => {
        setMessage(msg);
        setType(t);
        setIsVisible(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        
        timerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {isVisible && <div className={`toast-container toast-${type}`}>{message}</div>}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
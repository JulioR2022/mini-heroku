import type { ReactNode } from "react";
import './Modal.css';

interface ModalProps {
    isOpen:boolean;
    onClose:() => void;
    title:string;
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

export default function Modal({isOpen, onClose, title,size='md' ,children}:ModalProps){
    if(!isOpen) return null;
    return(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content modal-${size}`}  onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};
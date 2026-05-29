import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
    isLogout:boolean;
};

export function Header({isLogout=false}:HeaderProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (isLogout){
            localStorage.removeItem('token');
            navigate('/login');    
        }
        else {
            navigate(-1);
        }
    };

    return (
        <nav className={styles['header-nav']}>
            <div className={styles['nav-brand']}>
                <span className={styles['brand-logo']}>☁️</span>
                mini-heroku
            </div>
            <div className={styles['nav-actions']}>
                <button onClick={handleBack} className={styles['btn-action']}>
                    {isLogout ? 'Sair':'Voltar'}
                </button>
            </div>
        </nav>
    );
}
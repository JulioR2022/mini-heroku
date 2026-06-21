import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { me } from '../../services/auth';
import styles from './Header.module.css';

interface HeaderProps {
    isLogout:boolean;
};

export function Header({isLogout=false}:HeaderProps) {
    const navigate = useNavigate();
    const [accountType, setAccountType] = useState<string>('');

    const fetchUser = async () => {
            try {
                const user = await me();
                setAccountType(user.account_type);
            } catch {
            
            }
    };
    useEffect(() => {
        fetchUser();
    }, []);

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
                {accountType && (
                    <span className={`${styles['plan-badge']} ${styles[`plan-${accountType}`]}`}>
                        {accountType === 'premium' ? '⭐ Premium' : 'Free'}
                    </span>
                )}
            </div>
            <div className={styles['nav-actions']}>
                <button onClick={handleBack} className={styles['btn-action']}>
                    {isLogout ? 'Sair':'Voltar'}
                </button>
            </div>
        </nav>
    );
}
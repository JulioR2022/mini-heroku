import {login} from '../../services/auth'
import{ useState, type FormEvent } from 'react'; 
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import './Login.css';
import { useNavigate } from 'react-router-dom';

export function LoginPage(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const {showToast} = useToast();
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const data = new FormData();
            data.append('username', username);
            data.append('password',password);
            const response = await login(data);
            if(response.access_token) {
                localStorage.setItem('token', response.access_token);
                showToast('Login Feito com sucesso!', 'success');
                navigate('/dashboard');
            }

        } catch(err: unknown){
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.detail || 'Erro ao fazer login.', 'error');
            } else {
                showToast('Ocorreu um erro inesperado.','error');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <h2 className="login-title"> Entrar no mini-heroku </h2>
                <form onSubmit= {handleLogin} className="login-form">
                <Input 
                    label="Usuário" type="text" placeholder="Digite seu usuário" value={username} 
                    onChange={(e) => setUsername(e.target.value)} required 
                />
                <Input 
                    label="Senha" type="password" placeholder="Digite sua senha" value={password} 
                    onChange={(e) => setPassword(e.target.value)} required 
                />
                <Button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                </form>
                <Link to={'/register'} className='create-count' >
                 Registre-se
                 </Link>
            </div>
        </div>
    )
}   

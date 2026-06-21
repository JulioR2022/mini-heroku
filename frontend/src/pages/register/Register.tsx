import React, {useState} from 'react'
import { type UserRequest } from '../../types/user'
import { register } from '../../services/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { useToast } from '../../contexts/ToastContext';
import './Register.css'

export default function RegisterPage(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()
    const { showToast } = useToast();
    

    const handleRegister = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('As senhas não coincidem.', 'error');
            return;
        }

        setLoading(true);

        const request:UserRequest = {
                name: username,
                password: password
        };

        try{
            const response = await register(request);
            if(response){
                showToast('Usuário cadastrado com sucesso!', 'success');
                navigate('/login');
            }
        } catch(err: unknown){
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail || 'Erro ao cadastrar usuario.', 'error');
            } else {
                showToast('Ocorreu um erro inesperado.', 'error');
            }
        } finally {
            setLoading(false);
        }

    };

    return(
        <div className="register-wrapper">
            <div className= "register-card">
                <h2 className="register-title"> Cadastre sua conta</h2>
                <form onSubmit= {handleRegister} className="register-form">
                    <Input
                        label="Usuário" type='text' placeholder='Digite seu usuário' value={username}
                        onChange={(e) => setUsername(e.target.value)} required
                    />
                    <Input
                        label= "Senha" type='password' placeholder='Digite sua senha' value={password}
                        onChange= {(e) => setPassword(e.target.value)} required
                    />
                    <Input
                        label= "Confirme a senha" type='password' placeholder='Confirme sua senha' value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} required
                    />
                    <Button type='submit' disabled={loading}>
                        {loading ? 'Cadastrando...': 'Cadastrar'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
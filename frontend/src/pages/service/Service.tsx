import {useState, useEffect} from 'react'
import { type ServiceResponse } from '../../types/services';
import { useNavigate, useParams } from 'react-router-dom';
import { get_project, get_services } from '../../services/utils';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import './Service.css'



export default function ServicePage(){
    const {projectId} = useParams();
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const navigate = useNavigate();
    const {showToast} = useToast();
    const [projectName, setProjectName] = useState('')

    const fetchServices = async () => {
        const token = localStorage.getItem('token');
        if(!token){
            navigate('/login');
            return;
        }
        try{
            const response = await get_services(Number(projectId));
            setServices(response);
            const project_ = await get_project(Number(projectId));
            setProjectName(project_.name);
        } catch (err:unknown){
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail || 'Erro ao buscar serviços.','error');
            } else {
                showToast('Ocorreu algo inesperado.','error');
            }
        }       
    }

    const handleBack = () => {
        navigate('/dashboard');
    }

    useEffect(() => {
        if(projectId){
            fetchServices();
        }
    },[projectId]);
    
    return (
        <div className='service-layout'>
            <nav className='service-nav'>
                <div className='nav-brand'>
                    <span className='brand-logo'>
                        ☁️
                    </span>
                {projectName}
                </div>
                <div className='nav-actions'>
                <button onClick={handleBack} className='btn-logout'>
                    Voltar
                    </button>
                </div>
            </nav>
        
        <main className="service-content">
            <header className="content-header">
                <div className="header-info">
                    <h1>Serviços</h1>
                </div>
                <button className="btn-new">Novo Serviço +</button>
            </header>

            {services.length === 0 ? (
                <div className="empty-state">
                    <h2>Nenhum serviço encontrado</h2>
                    <p>Adicione seu primeiro serviço neste projeto para começar.</p>
                </div>
            ) : (
                <div className="projects-grid">
                    {services.map(service => (
                        <div key={service.id} className="project-card">
                            <div className="project-info">
                                <h3 className="project-name">{service.name || 'Nome do Serviço'}</h3>
                                <span className="project-date">Status: {service.status || 'N/A'}</span>
                            </div>
                            <div className="project-card-footer">
                                <span className="open-text">Gerenciar</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
        </div>
    )
};
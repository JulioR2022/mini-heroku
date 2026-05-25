import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import type { ProjectResponse } from '../../types/project';
import { get_projects } from '../../services/utils';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import './Dashboard.css';

export default function Dashboard(){
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const navigate = useNavigate();
    const {showToast} = useToast();

    useEffect(() => {
        fetchProjects();
    },[]);

    const fetchProjects = async() => {
        const token = localStorage.getItem('token');
        if(!token){
            navigate('/login');
            return;
        }
        try{
            const response = await get_projects();
            setProjects(response);
        } catch (err: unknown) {
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail,'error');
                localStorage.removeItem('token');
            }
            else {
                showToast('Ocorreu algo inesperado.','error');
            }
        } finally{
            setLoading(false);
        } 
            
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className='dashboard-layout'>
            <nav className='dashboard-nav'>
                <div className='nav-brand'>
                    <span className='brand-logo'>☁️</span>
                    mini-heroku
                </div>
                <div className="nav-actions">
                    <button onClick={handleLogout} className="btn-logout">
                        Sair
                    </button>
                </div>
            </nav>
            <main className="dashboard-content">
                <header className="content-header">
                    <div className="header-info">
                        <h1>Dashboard</h1>
                    </div>
                    <button className="btn-new">New +</button>
                </header>

                {loading ? (
                    <div className="loading-state">
                        Carregando seus projetos...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="empty-state">
                        <h2>Nenhum projeto encontrado</h2>
                        <p>Implante seu primeiro web service para começar.</p>
                        <button className="btn-new mt-4">Criar Web Service</button>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map(project => (
                            <ProjectCard key={project.id} project={project}/>
                        ))}
                    </div>
                )}
            </main>

        </div>
    );
};
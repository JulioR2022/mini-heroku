import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import type { ProjectResponse, ProjectRequest } from '../../types/project';
import { createProject, get_projects } from '../../services/utils';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import './Dashboard.css';
import Modal from '../../components/Modal/Modal';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';

export default function Dashboard(){
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loadingModal, setLoadingModal]  = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleModal = () => {
        setIsModalOpen(true)
    }
    
    const handleCreateProject = async(e: React.FormEvent) => {
        e.preventDefault(); 
        setLoadingModal(true);
        if (newProjectName.trim() === '') {
            showToast('Nome não pode ser vazio.','error');
            setLoadingModal(false);
            return;
        }
        try{
            const newProject:ProjectRequest = {
                name:newProjectName
            }
            await createProject(newProject);
            showToast('Projeto criado com sucesso!', 'success');
            fetchProjects();

        } catch(err:unknown) {
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail,'error');
            }
            else{
                showToast("ErroInesperado",'error');
            }
        }finally {
            setNewProjectName('');
            setLoadingModal(false);
            setIsModalOpen(false); 
        }
        
    }

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

                    <Button onClick={handleModal} variant='custom' customColor='black'>
                        Novo Projeto +
                    </Button>

                    <Modal
                        isOpen={isModalOpen}
                        title='Novo Projeto'
                        onClose={() => setIsModalOpen(false)}
                    >
                        <form onSubmit={handleCreateProject}>
                            <Input
                                label='Nome do projeto'
                                type='text'
                                placeholder='Digite o nome do novo Projeto'
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                required
                            />
                            <div className="modal-actions">
                                <Button type="button" variant="danger" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loadingModal}>
                                    {loadingModal ? 'Criando...' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </Modal>
                </header>

                {loading ? (
                    <div className="loading-state">
                        Carregando seus projetos...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="empty-state">
                        <h2>Nenhum projeto encontrado</h2>
                        <p>Implante seu primeiro projeto para começar.</p>
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
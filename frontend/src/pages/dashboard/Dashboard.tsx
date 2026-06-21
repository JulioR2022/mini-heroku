import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import type { ProjectResponse, ProjectRequest } from '../../types/project';
import type { PlanInfo } from '../../types/user';
import { createProject, get_all_user_projects, getUserPlan, upgradeAccount } from '../../services/utils';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import './Dashboard.css';
import Modal from '../../components/Modal/Modal';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { Header } from '../../components/Header/Header';

export default function Dashboard(){
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loadingModal, setLoadingModal]  = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [planInfo, setPlanInfo] = useState<PlanInfo>();
    const [isUpgrading, setIsUpgrading] = useState(false);
    const navigate = useNavigate();
    const {showToast} = useToast();

    useEffect(() => {
        fetchProjects();
        fetchPlan();
    },[]);

    const fetchPlan = async () => {
        try {
            const plan = await getUserPlan();
            setPlanInfo(plan);
        } catch {
            
        }
    };

    const fetchProjects = async() => {
        const token = localStorage.getItem('token');
        if(!token){
            navigate('/login');
            return;
        }
        try{
            const response = await get_all_user_projects();
            setProjects(response);
        } catch (err: unknown) {
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail || 'Erro ao carregar projetos.','error');
                
            }
            else {
                showToast('Ocorreu algo inesperado.','error');
            }
        } finally{
            setLoading(false);
        } 
            
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
            fetchPlan();

        } catch(err:unknown) {
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail || 'Erro ao criar projeto.','error');
            }
            else{
                showToast("Erro inesperado",'error');
            }
        }finally {
            setNewProjectName('');
            setLoadingModal(false);
            setIsModalOpen(false); 
        }
        
    }

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        try {
            const newType = planInfo?.account_type === 'premium' ? 'free' : 'premium';
            await upgradeAccount(newType);
            fetchPlan();
            const message = (
                newType === 'premium' 
                ? 'Upgrade para Premium realizado com sucesso!' 
                : 'Conta alterada para Free.'
            );
            showToast(message,'success');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.detail || 'Erro ao alterar plano.', 'error');
            } else {
                showToast('Erro inesperado.', 'error');
            }
        } finally {
            setIsUpgrading(false);
        }
    };

    const isAtProjectLimit = planInfo 
        ? planInfo.usage.projects >= planInfo.limits.max_projects 
        : false;

    return (
        <div className='dashboard-layout'>
            <Header isLogout={true}/>
            <main className="dashboard-content">
                <header className="content-header">
                    <div className="header-info">
                        <h1>Dashboard</h1>
                    </div>

                    <Button onClick={handleModal} variant='custom' customColor='black'
                        disabled={isAtProjectLimit}
                        title={isAtProjectLimit ? 'Limite de projetos atingido' : ''}
                    >
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

                {planInfo && (
                    <div className="plan-card">
                        <div className="plan-info-row">
                            <div className="plan-detail">
                                <span className="plan-detail-label">Plano Atual</span>
                                <span className={`plan-type plan-type-${planInfo.account_type}`}>
                                    {planInfo.limits.label}
                                </span>
                            </div>
                            <div className="plan-detail">
                                <span className="plan-detail-label">Projetos</span>
                                <span className="plan-detail-value">
                                    {planInfo.usage.projects} / {planInfo.limits.max_projects}
                                </span>
                                <div className="usage-bar">
                                    <div 
                                        className="usage-bar-fill"
                                        style={{ 
                                            width: `${Math.min((planInfo.usage.projects / planInfo.limits.max_projects) * 100, 100)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="plan-detail">
                                <span className="plan-detail-label">Serviços</span>
                                <span className="plan-detail-value">
                                    {planInfo.usage.services} / {planInfo.limits.max_services}
                                </span>
                                <div className="usage-bar">
                                    <div 
                                        className="usage-bar-fill"
                                        style={{ 
                                            width: `${Math.min((planInfo.usage.services / planInfo.limits.max_services) * 100, 100)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="plan-detail">
                                <span className="plan-detail-label">RAM / Container</span>
                                <span className="plan-detail-value">{planInfo.limits.mem_limit}</span>
                            </div>
                            <div className="plan-detail">
                                <span className="plan-detail-label">CPU / Container</span>
                                <span className="plan-detail-value">
                                    {(planInfo.limits.nano_cpus / 1_000_000_000).toFixed(1)} vCPU
                                </span>
                            </div>
                        </div>
                        <div className="plan-upgrade-section">
                            <Button 
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                variant="custom" 
                                customColor={planInfo.account_type === 'premium' ? '#6b7280' : '#f59e0b'}
                            >
                                {isUpgrading 
                                    ? 'Processando...' 
                                    : planInfo.account_type === 'premium' 
                                        ? 'Voltar para Free' 
                                        : '⭐ Fazer Upgrade para Premium'
                                }
                            </Button>
                        </div>
                    </div>
                )}

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
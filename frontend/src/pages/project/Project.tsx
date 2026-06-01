import React, {useState, useEffect} from 'react'
import { type EnvVar, type ServiceRequest, type ServiceResponse } from '../../types/services';
import { useNavigate, useParams } from 'react-router-dom';
import { createService, getProject, get_all_project_services } from '../../services/utils';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import axios from 'axios';
import './Project.css'
import Modal from '../../components/Modal/Modal';
import { ServiceCard } from '../../components/ServiceCard/ServiceCard';
import { Header } from '../../components/Header/Header';



export default function ProjectPage(){
    const {projectId} = useParams();
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Necessario para criar um service
    const [newServiceName, setNewServiceName] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [rootDir, setRootDir] = useState('');
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [draftEnvVar, setDraftEnvVar] = useState<EnvVar>({key:'', value:''});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);


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
            const [servicesResponse, projectResponse] = await Promise.all([
                get_all_project_services(Number(projectId)),
                getProject(Number(projectId))
            ]);
            setServices(servicesResponse);
            setProjectName(projectResponse.name);
        } catch (err:unknown){
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail || 'Erro ao buscar serviços.','error');
            } else {
                showToast('Ocorreu algo inesperado.','error');
            }
        }       
    }
   
    const handleEnvVarRemove = (index:number) => {
        setEnvVars(envVars.filter((_,i)=> i !== index));
    };

    const handleEnvVarChange = (index:number, field:'key' | 'value', val:string) => {
        const newList = [...envVars];
        newList[index] = { ...newList[index], [field]: val };
        setEnvVars(newList);
    };

    const handleConfirmAdd = () => {
        const newList = [...envVars, draftEnvVar];
        setEnvVars(newList);
        setDraftEnvVar({key:'', value:''});
        setIsAdding(false);
    };

    const handleCancelAdd = () => {
        setDraftEnvVar({key:'', value:''});
        setIsAdding(false);
    }

    const handleCancel = () => {
        setDraftEnvVar({key:'', value:''});
        setIsModalOpen(false);
        setLoading(false);
        setNewServiceName('');
        setRepoUrl('');
        setRootDir('');
        setEnvVars([]);
        setEditingIndex(null);
        setIsAdding(false);
    }

    const handleCreateService = async(e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if(newServiceName.trim() === ''){
            showToast('Nome não pode estar vazio.','error');
            setNewServiceName('');
            setLoading(false);
            return;
        }
        try{
            const formattedEnvVars = envVars.reduce((acc, curr) => {
                if(curr.key.trim() !== ''){
                    acc[curr.key.trim()] = curr.value;
                }
                return acc;
            },{} as Record<string,string>);
            const newService:ServiceRequest = {
                name: newServiceName,
                project_id:Number(projectId),
                repo_url:repoUrl,
                root_dir:rootDir,
                env_vars:formattedEnvVars
            } ;
            await createService(newService);
            fetchServices();
            setIsModalOpen(false);
            setNewServiceName('');
            setRepoUrl('');
            setRootDir('');
            setEnvVars([]);
            setEditingIndex(null);
            setIsAdding(false);
        } catch (err: unknown) {
            if(axios.isAxiosError(err)){
                showToast(err.response?.data?.detail,'error');
            } else {
                showToast('Erro Inesperado','error');
            }
        } finally {
            setLoading(false);
        }
        
    };

    useEffect(() => {
        if(projectId){
            fetchServices();
        }
    },[projectId]);
    
    return (
        <div className='service-layout'>
            <Header isLogout={false}/>
        <main className="service-content">
            <header className="content-header">
                <div className="header-info">
                    <h1>{projectName}</h1>
                </div>
                <Button variant='custom' customColor='black' onClick={() => setIsModalOpen(true)}>
                    Novo Serviço +
                </Button>
                <Modal title='New Service' isOpen={isModalOpen} onClose={()=>{setIsModalOpen(false)}}>
                    <form onSubmit={handleCreateService}>
                        <Input
                            label='Name'
                            type='text'
                            placeholder='Type in the service name'
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)} required
                        />
                        <Input
                            label='Repo'
                            type='text'
                            placeholder='Type in the repo url'
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)} 
                        />
                        <Input
                            label='Root Repo'
                            type='text'
                            placeholder='Type in the the path to Dockerfile'
                            value={rootDir}
                            onChange={(e) => setRootDir(e.target.value)}
                        />

                        <div className="env-vars-section">
                            <div className="env-vars-header">
                                <h3 className="env-vars-title">Enviroment Varibles</h3>
                                <Button 
                                    type="button" 
                                    className="btn btn-success btn-sm" 
                                    onClick={() => setIsAdding(true)}
                                >
                                    + Add
                                </Button>
                            </div>

                            <div className="env-vars-list">
                                {envVars.length === 0 ? (
                                    <div className="env-vars-empty">
                                        Nenhuma variável configurada. Adicione a primeira!
                                    </div>
                                ) : (
                                    envVars.map((envVar, index) => (
                                        <div key={index} className="env-var-row saved-row">
                                            <Input 
                                                value={envVar.key} 
                                                readOnly={editingIndex !== index} 
                                                onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)} 
                                            />
                                            <Input 
                                                value={envVar.value} 
                                                readOnly={editingIndex !== index} 
                                                onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)} 
                                            />
                                            
                                            {editingIndex === index ? (
                                                <Button 
                                                    type='button'
                                                    variant='custom' customColor='#28a745'
                                                    onClick={() => setEditingIndex(null)}
                                                >
                                                    Salvar    
                                                </Button>
                                            ) : (
                                                <Button 
                                                    type='button'
                                                    onClick={() => setEditingIndex(index)}
                                                >
                                                    Editar    
                                                </Button>
                                            )}
                                            <Button 
                                                type="button" 
                                                className="btn btn-danger btn-icon"
                                                onClick={() => handleEnvVarRemove(index)}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ))
                                )}
                                {isAdding && (
                                    <div className='env-var-row draft-row'>
                                        <Input
                                            placeholder="Key"
                                            value={draftEnvVar.key}
                                            onChange={(e) => setDraftEnvVar({ ...draftEnvVar, key: e.target.value })}
                                            autoFocus 
                                        />
                                        <Input
                                            placeholder="Value"
                                            value={draftEnvVar.value}
                                            onChange={(e) => setDraftEnvVar({ ...draftEnvVar, value: e.target.value })}
                                             
                                        />
                                        <Button 
                                            type="button" 
                                            className="btn btn-success btn-icon"
                                            onClick={handleConfirmAdd}
                                            disabled={!draftEnvVar.key.trim()}
                                        >
                                            ✓
                                        </Button>
                                        <Button 
                                            type="button" 
                                            className="btn btn-danger btn-icon"
                                            onClick={handleCancelAdd}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                    
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-actions">
                            <Button type="button" variant="danger" onClick={() => handleCancel()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Criando...' : 'Criar'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </header>
            {services.length === 0 ? (
                <div className="empty-state">
                    <h2>Nenhum serviço encontrado</h2>
                    <p>Adicione seu primeiro serviço neste projeto para começar.</p>
                </div>
            ) : (
                <div className="service-grid">
                    {services.map(service => (
                        <ServiceCard 
                            key={service.id}
                            service={service}
                            nav_path={`/dashboard/${projectName.toLowerCase()}/${service.id}`}
                        />
                    ))}
                </div>
            )}
        </main>
        </div>
    )
};
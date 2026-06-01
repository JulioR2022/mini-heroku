import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button'; 
import { Input } from '../../components/Input/Input';
import styles from './Service.module.css';
import { Header } from '../../components/Header/Header';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { deleteService, getService, getServiceEnv, updateService } from '../../services/utils';
import { useState } from 'react';
import type { EnvVar, ServiceResponse, ServiceUpdate } from '../../types/services';
import axios, { isAxiosError } from 'axios';
import Modal from '../../components/Modal/Modal';
import { PencilLine, Check, X } from 'lucide-react';

export default function ServicePage() {
    const navigation = useNavigate();
    const {showToast} = useToast();
    const {serviceId} = useParams();
    const [service, setService] = useState<ServiceResponse>();
    const [update, setUpdate] = useState<ServiceUpdate>({})
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [draftVar, setDraftVar] = useState<EnvVar>({key:'', value:''});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [envError, setEnvError] = useState('');
    const [editRepo, setEditRepo] = useState(false);
    const [editRootDir, setEditRootDir] = useState(false);
    const [editName, setEditName] = useState(false);


    useEffect(() =>{
        fetchService();
    },[]);
    
    const fetchService = async () => {
        try {
            const [serviceResponse, envResponse] = await Promise.all([
                getService(Number(serviceId)),
                getServiceEnv(Number(serviceId))
            ]);
            setService(serviceResponse);
            setEnvVars(envResponse);
        } catch(err:unknown) {
            if(axios.isAxiosError(err)){
                showToast(err?.response?.data.detail,'error');
                
            }
            else {
                showToast('Unknown Error. Try again.', 'error');
            }
        }
    }

    const handleDeleteService = async() => {
        setIsDeleting(true);
        try {
            await deleteService(Number(serviceId));
            const response = `${service?.name} removido`;
            navigation(-1);
            showToast(response,'success');
        } catch(err:unknown) {
            if(isAxiosError(err)){
                showToast(err?.response?.data.detail,'error');
            } else {
                showToast('Unknown error.','error');
            }         
        }   finally{
            setIsDeleting(false);
        }
    };
    
    const handleEditRepo = async() => {
        if(update?.repo_url?.trim() !== service?.repo_url?.trim()){
            try {
                const response = await updateService(Number(serviceId), update);
                setService(response);
                showToast('Repositório atualizado com sucesso!', 'success');
            } catch(err: unknown) {
                if (isAxiosError(err)) {
                    showToast(err?.response?.data?.detail || 'Erro ao atualizar o repositório.', 'error');
                } else {
                    showToast('Erro desconhecido.', 'error');
                }
                return; 
            }
        }
        setUpdate({});
        setEditRepo(false);
    };

    const handleEditRootDir = async() => {
        if(update?.root_dir?.trim() !== service?.root_dir?.trim()){
            try {
                const response = await updateService(Number(serviceId), update);
                setService(response);
                showToast('Repositório atualizado com sucesso!', 'success');
            } catch(err: unknown) {
                if (isAxiosError(err)) {
                    showToast(err?.response?.data?.detail || 'Erro ao atualizar o repositório.', 'error');
                } else {
                    showToast('Erro desconhecido.', 'error');
                }
                return; 
            }
        }
        setUpdate({});
        setEditRootDir(false);
    };

    const handleEditName = async() => {
        if(update?.name?.trim() !== service?.name?.trim()){
            try {
                const response = await updateService(Number(serviceId), update);
                setService(response);
                showToast('Repositório atualizado com sucesso!', 'success');
            } catch(err: unknown) {
                if (isAxiosError(err)) {
                    showToast(err?.response?.data?.detail || 'Erro ao atualizar o repositório.', 'error');
                } else {
                    showToast('Erro desconhecido.', 'error');
                }
                return; 
            }
        }
        setUpdate({});
        setEditName(false);
    };

    const handleAddEnvVar = async () => {
        if (draftVar.key.trim() === '' || draftVar.value.trim() === '') {
            setEnvError('Ambos os campos são obrigatórios.');
            return;
        }
        setEnvError('');
        const newList = [...envVars, draftVar];
        setEnvVars(newList);
        setDraftVar({ key: '', value: '' });
        
        const formattedEnvVars = newList.reduce((acc, curr) => {
                if(curr.key.trim() !== ''){
                    acc[curr.key.trim()] = curr.value;
                }
                return acc;
        },{} as Record<string,string>);
        
        try {
            const response = await updateService(Number(serviceId), { env_vars: formattedEnvVars });
            setService(response);
            showToast('Variável adicionada com sucesso!', 'success');
        } catch(err:unknown) {
            if(isAxiosError(err)) {
                showToast(err?.response?.data.detail,'error');
            } else {
                showToast('Erro Inesperado.','error');
            }
        }
    };

    const handleRemoveEnvVar = async(index:number) => {
        const newList = envVars.filter((_, i) => i !== index);
        setEnvVars(newList);

        const formattedEnvVars = newList.reduce((acc, curr) => {
            if(curr.key.trim() !== ''){
                acc[curr.key.trim()] = curr.value;
            }
            return acc;
        }, {} as Record<string, string>);

        try {
            const response = await updateService(Number(serviceId), {
                env_vars: formattedEnvVars
            });
            setService(response);
            showToast('Variável removida com sucesso!', 'success');
        } catch(err:unknown) {
            if (isAxiosError(err)) {
                showToast(err?.response?.data?.detail, 'error');
            } else {
                showToast('Erro desconhecido.', 'error');
            }
        }
    };

    return (
        <div className={styles['service-page']}>
            <Header isLogout={false}/>
            <main className={styles['service-main']}>
                <header className={styles['service-header']}>
                    <div className={styles['header-title']}>
                        {editName ?(
                            <span className={styles['info-value']}>
                                <Input
                                    value={update.name}
                                    onChange={(e) => setUpdate(
                                        {name:e.target.value}
                                    )}
                                />
                                <Button 
                                    onClick={handleEditName}
                                >
                                    <Check/>
                                </Button>
                                <Button 
                                    variant='danger'
                                    onClick={() =>{
                                        setUpdate({
                                            name:undefined
                                        });
                                        setEditName(false);
                                    }}
                                >
                                    <X></X>
                                </Button>
                            </span>
                        ) :(
                            <span className={styles['info-value']}>
                                <h1>{service?.name}</h1>
                                <button 
                                    className={styles['edit-button']}
                                    onClick={() =>{
                                        setUpdate({name:service?.name});
                                        setEditName(true);
                                    }}
                                >
                                    <PencilLine size={18} />
                                </button> 
                            </span>
                        )}                
                    </div>
                    <div className={styles['header-controls']}>
                        <Button 
                            variant="custom" 
                            customColor="#475569"
                        >
                            Reiniciar
                        </Button>
                        <Button variant="primary">Deploy Manual</Button>
                    </div>
                </header>

                <div className={styles['content-grid']}>
                    <div className={styles['grid-column']}>
                        <section className={styles.card}>
                            <h2 className={styles['section-title']}>
                                Detalhes do Serviço
                            </h2>
                            <div className={styles['info-list']}>
                                {editRepo ?(
                                    <span className={styles['info-value']}>
                                        <Input
                                            value={update.repo_url}
                                            onChange={(e) => setUpdate(
                                                {repo_url:e.target.value}
                                            )}
                                        />
                                        <Button 
                                        onClick={handleEditRepo}
                                        >
                                            <Check/>
                                        </Button>
                                        <Button 
                                            variant='danger'
                                            onClick={() =>{
                                                setUpdate({
                                                    repo_url:undefined
                                                });
                                                setEditRepo(false);
                                            }}
                                        >
                                            <X></X>
                                        </Button>
                                    </span>
                                ):(
                                    <div className={styles['info-item']}>
                                        <span className={styles['info-label']}>
                                            Repositório
                                        </span>
                                        <span className={styles['info-value']}>
                                            {service?.repo_url}
                                            <button 
                                                className={styles['edit-button']}
                                                onClick={() =>{
                                                    setUpdate({repo_url:service?.repo_url});
                                                    setEditRepo(true);
                                                }}
                                            >
                                                <PencilLine size={18} />
                                            </button> 
                                        </span>
                                    </div>
                                )}
                                {editRootDir 
                                ?(
                                    <span className={styles['info-value']}>
                                        <Input
                                            value={update.root_dir}
                                            onChange={(e) => setUpdate(
                                                {root_dir:e.target.value}
                                            )}
                                        />
                                        <Button 
                                            onClick={handleEditRootDir}
                                        >
                                            <Check/>
                                        </Button>
                                        <Button 
                                            variant='danger'
                                            onClick={() =>{
                                                setUpdate({
                                                    root_dir:undefined
                                                });
                                                setEditRootDir(false);
                                            }}
                                        >
                                            <X></X>
                                        </Button>
                                    </span>
                                ):(
                                    <div className={styles['info-item']}>
                                        <span className={styles['info-label']}>
                                            Branch
                                        </span>
                                        <span className={styles['info-value']}>
                                            {service?.root_dir}
                                            <button 
                                                className={styles['edit-button']}
                                                onClick={() =>{
                                                    setUpdate({root_dir:service?.root_dir});
                                                    setEditRootDir(true);
                                                }}
                                            >
                                                <PencilLine size={18} />
                                            </button> 
                                        </span>
                                    
                                    </div>
                                    
                                )}
                                <div className={styles['info-item']}>
                                    <span className={styles['info-label']}>Status</span>
                                    <span className={styles['info-value']}>{service?.status}</span>
                                </div>
                                <div className={styles['info-item']}>
                                    <span className={styles['info-label']}>URL Pública</span>
                                        {service?.port ? 
                                            <a href="#" className={styles['info-link']}>{`https://localhost:${service?.port}`}</a>
                                        
                                        : <a> Waiting for Deploy</a>
                                        }
                                    
                                </div>
                            </div>
                        </section>
                        <section className={styles.card}>
                            <h2>Variáveis de Ambiente</h2>
                            <p className={styles['card-description']}>Gerencie as chaves secretas e configurações da sua aplicação.</p>
                            
                            <div className={styles['env-list']}>
                                {envVars.map((envVar, index) => (
                                    <div key={envVar.key} className={styles['env-row']}>
                                        <Input defaultValue={envVar.key} readOnly />
                                        <Input type="password" defaultValue={envVar.value} readOnly />
                                        <Button 
                                            variant="danger"
                                            onClick={() =>handleRemoveEnvVar(index)}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                ))}
                                       
                                <div className={styles['new-env-container']}>
                                    <div className={`${styles['env-row']} ${styles['new-env-row']}`}>
                                        <Input 
                                            placeholder="CHAVE"
                                            type='text' 
                                            value={draftVar.key} 
                                            onChange={(e) => {
                                                setDraftVar({...draftVar,key:e.target.value});
                                                if (envError) setEnvError('');
                                            }}
                                        />
                                        <Input 
                                            placeholder="VALOR"
                                            type='text'
                                            value={draftVar.value}
                                            onChange={(e) => {
                                                setDraftVar({...draftVar, value:e.target.value});
                                                if (envError) setEnvError('');
                                            }} 
                                        />
                                        <Button 
                                            variant="primary"
                                            onClick={handleAddEnvVar}
                                        >
                                            Adicionar
                                        </Button>
                                    </div>
                                    {envError && <p className={styles['env-error-msg']}>{envError}</p>}
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className={styles['grid-column']}>
                        <section className={`${styles.card} ${styles['card-logs']}`}>
                            <div className={styles['logs-header']}>
                                <h2>Logs da Aplicação</h2>
                                <Button variant="custom" customColor="#e2e8f0" style={{ color: '#1e293b', fontSize: '0.8rem', padding: '4px 8px' }}>
                                    Copiar
                                </Button>
                            </div>
                            <div className={styles.terminal}>
                                <div className={styles['log-line']}><span className={styles['log-time']}>14:02:10</span> Starting application...</div>
                                <div className={styles['log-line']}><span className={styles['log-time']}>14:02:12</span> Connected to PostgreSQL database.</div>
                                <div className={styles['log-line']}><span className={styles['log-time']}>14:02:13</span> Server listening on port 8000</div>
                                <div className={`${styles['log-line']} ${styles['log-request']}`}><span className={styles['log-time']}>14:05:01</span> GET /health - 200 OK - 12ms</div>
                                <div className={`${styles['log-line']} ${styles['log-request']}`}><span className={styles['log-time']}>14:10:22</span> POST /api/checkout - 201 Created - 145ms</div>
                            </div>
                        </section>

                        <section className={`${styles.card} ${styles['danger-zone']}`}>
                            <div className={styles['danger-content']}>
                                <div>
                                    <h2>Excluir Serviço</h2>
                                    <p>Uma vez excluído, não há como recuperar os dados ou o histórico de deploys.</p>
                                </div>
                                <Button variant="danger"
                                        onClick={() => setIsModalOpen(true)}
                                        disabled={isDeleting}>
                                    {isDeleting ? 'Excluindo' : 'Excluir'}
                                </Button>
                            </div>
                        </section>
                        <Modal title='Aviso' size='sm' isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                            <p> Tem certeza? Essa ação não pode ser desfeita. </p>
                            <div className="modal-actions">
                                <Button type="button" variant="danger" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="button" onClick={handleDeleteService}>
                                    Confirmar
                                </Button>
                            </div>
                        </Modal>
                    </div>
                </div>
            </main>
        </div>
    );
}
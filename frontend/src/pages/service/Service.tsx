import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button'; 
import { Input } from '../../components/Input/Input';
import styles from './Service.module.css';
import { Header } from '../../components/Header/Header';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { deleteService, getService, getServiceEnv, triggerDeploy, updateService, streamLogs, restartService, getUserPlan } from '../../services/utils';
import { useState } from 'react';
import type { EnvVar, ServiceResponse, ServiceUpdate } from '../../types/services';
import type { PlanInfo } from '../../types/user';
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
    const [editMode, setEditMode] = useState<keyof ServiceUpdate | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

    useEffect(() =>{
        fetchService();
    },[]);
    
    const fetchService = async () => {
        try {
            const [serviceResponse, envResponse, planResponse] = await Promise.all([
                getService(Number(serviceId)),
                getServiceEnv(Number(serviceId)),
                getUserPlan()
            ]);
            setService(serviceResponse);
            setEnvVars(envResponse);
            setPlanInfo(planResponse);
        } catch(err:unknown) {
            if(axios.isAxiosError(err)){
                showToast(err?.response?.data.detail || 'Erro ao carregar serviço.','error');
                
            }
            else {
                showToast('Erro desconhecido. Tente novamente.', 'error');
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
                showToast(err?.response?.data.detail || 'Erro ao excluir serviço.','error');
            } else {
                showToast('Erro desconhecido.','error');
            }         
        }   finally{
            setIsDeleting(false);
        }
    };
    
    const handleEdit = async (field: keyof ServiceUpdate) => {
        const newVal = update[field] as string | undefined;
        const original = service?.[field as keyof ServiceResponse] as string | undefined;

        if (newVal?.trim() === original?.trim()) {
            setUpdate({});
            setEditMode(null);
            return;
        }
        
        try {
            const response = await updateService(Number(serviceId), { [field]: newVal });
            setService(response);
            showToast('Atualizado com sucesso!', 'success');
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                showToast(err?.response?.data?.detail || 'Erro ao atualizar.', 'error');
            } else {
                showToast('Erro desconhecido.', 'error');
            }
        } finally {
            setUpdate({});
            setEditMode(null);
        }
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
                showToast(err?.response?.data.detail || 'Erro ao adicionar variável.','error');
            } else {
                showToast('Erro inesperado.','error');
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
                showToast(err?.response?.data?.detail || 'Erro ao remover variável.', 'error');
            } else {
                showToast('Erro desconhecido.', 'error');
            }
        }
    };

    useEffect(() => {
        if (!isDeploying || !service?.name) return;

        const ws = streamLogs(service.name);

        ws.onopen = () => {
            const token = localStorage.getItem('token');
            ws.send(token ?? '');
            setLogs(prev => [...prev, "> Conexão estabelecida! Aguardando container..."]);
        };

        ws.onmessage = (event) => {
            setLogs(prev => [...prev, event.data]);
        };

        ws.onclose = () => {
            setLogs(prev => [...prev, "> Conexão encerrada pelo servidor."]);
            setIsDeploying(false);
            fetchService(); // Recarrega para atualizar o status
        };
        
        ws.onerror = () => {
            setLogs(prev => [...prev, "> Erro na conexão do terminal."]);
            setIsDeploying(false);
        };

        return () => {
            ws.close();
        };
    }, [isDeploying]);

    const handleDeploy = async() => {
        try {
            setLogs(["> Iniciando deploy..."]);
            await triggerDeploy(Number(serviceId));
            setIsDeploying(true);
            showToast('Deploy iniciado com sucesso!', 'success');
        } catch (err:unknown) {
            if(isAxiosError(err)){
                showToast(err?.response?.data.detail || 'Erro ao iniciar deploy.','error');
            } else {
                showToast('Erro inesperado.','error');
            }
            setIsDeploying(false);
        }
    };

    const handleRestart = async() => {
        setIsRestarting(true);
        try {
            setLogs(["> Reiniciando serviço..."]);
            await restartService(Number(serviceId));
            setIsDeploying(true);
            showToast('Reinício iniciado!', 'success');
        } catch (err:unknown) {
            if(isAxiosError(err)){
                showToast(err?.response?.data.detail || 'Erro ao reiniciar.','error');
            } else {
                showToast('Erro inesperado.','error');
            }
        } finally {
            setIsRestarting(false);
        }
    };

    const handleCopyLogs = () => {
        const logText = logs.join('\n');
        navigator.clipboard.writeText(logText).then(() => {
            showToast('Logs copiados!', 'success');
        }).catch(() => {
            showToast('Erro ao copiar logs.', 'error');
        });
    };

    return (
        <div className={styles['service-page']}>
            <Header isLogout={false}/>
            <main className={styles['service-main']}>
                <header className={styles['service-header']}>
                    <div className={styles['header-title']}>
                    {editMode === 'name' ?(
                            <span className={styles['info-value']}>
                                <Input
                                    value={update.name}
                                    onChange={(e) => setUpdate(
                                        {name:e.target.value}
                                    )}
                                />
                                <Button 
                                onClick={() => handleEdit('name')}
                                >
                                    <Check/>
                                </Button>
                                <Button 
                                    variant='danger'
                                    onClick={() =>{
                                        setUpdate({
                                            name:undefined
                                        });
                                    setEditMode(null);
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
                                    setEditMode('name');
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
                            onClick={handleRestart}
                            disabled={isRestarting}
                        >
                            {isRestarting ? 'Reiniciando...' : 'Reiniciar'}
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={handleDeploy}    
                        >
                            Deploy Manual
                        </Button>
                    </div>
                </header>

                <div className={styles['content-grid']}>
                    <div className={styles['grid-column']}>
                        <section className={styles.card}>
                            <h2 className={styles['section-title']}>
                                Detalhes do Serviço
                            </h2>
                            <div className={styles['info-list']}>
                            {editMode === 'repo_url' ?(
                                    <span className={styles['info-value']}>
                                        <Input
                                            value={update.repo_url}
                                            onChange={(e) => setUpdate(
                                                {repo_url:e.target.value}
                                            )}
                                        />
                                        <Button 
                                        onClick={() => handleEdit('repo_url')}
                                        >
                                            <Check/>
                                        </Button>
                                        <Button 
                                            variant='danger'
                                            onClick={() =>{
                                                setUpdate({
                                                    repo_url:undefined
                                                });
                                            setEditMode(null);
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
                                                setEditMode('repo_url');
                                                }}
                                            >
                                                <PencilLine size={18} />
                                            </button> 
                                        </span>
                                    </div>
                                )}
                            {editMode === 'root_dir' 
                                ?(
                                    <span className={styles['info-value']}>
                                        <Input
                                            value={update.root_dir}
                                            onChange={(e) => setUpdate(
                                                {root_dir:e.target.value}
                                            )}
                                        />
                                        <Button 
                                        onClick={() => handleEdit('root_dir')}
                                        >
                                            <Check/>
                                        </Button>
                                        <Button 
                                            variant='danger'
                                            onClick={() =>{
                                                setUpdate({
                                                    root_dir:undefined
                                                });
                                            setEditMode(null);
                                            }}
                                        >
                                            <X></X>
                                        </Button>
                                    </span>
                                ):(
                                    <div className={styles['info-item']}>
                                        <span className={styles['info-label']}>
                                            Diretório Raiz
                                        </span>
                                        <span className={styles['info-value']}>
                                            {service?.root_dir}
                                            <button 
                                                className={styles['edit-button']}
                                                onClick={() =>{
                                                    setUpdate({root_dir:service?.root_dir});
                                                setEditMode('root_dir');
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
                                            <a href={`http://localhost:${service?.port}`} target="_blank" rel="noreferrer" className={styles['info-link']}>{`http://localhost:${service?.port}`}</a>
                                        
                                        : <span className={styles['info-value']}>Aguardando deploy</span>
                                        }
                                    
                                </div>
                            </div>
                        </section>

                        {planInfo && (
                            <section className={styles.card}>
                                <h2>Recursos do Plano</h2>
                                <p className={styles['card-description']}>Recursos alocados para cada container com base no seu plano.</p>
                                <div className={styles['resource-grid']}>
                                    <div className={styles['resource-item']}>
                                        <span className={styles['resource-label']}>CPU</span>
                                        <span className={styles['resource-value']}>
                                            {(planInfo.limits.nano_cpus / 1_000_000_000).toFixed(1)} vCPU
                                        </span>
                                    </div>
                                    <div className={styles['resource-item']}>
                                        <span className={styles['resource-label']}>Memória RAM</span>
                                        <span className={styles['resource-value']}>
                                            {planInfo.limits.mem_limit}
                                        </span>
                                    </div>
                                    <div className={styles['resource-item']}>
                                        <span className={styles['resource-label']}>Plano</span>
                                        <span className={`${styles['resource-value']} ${styles[`plan-${planInfo.account_type}`]}`}>
                                            {planInfo.limits.label}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}

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
                                <Button 
                                    variant="custom" 
                                    customColor="#e2e8f0" 
                                    style={{ color: '#1e293b', fontSize: '0.8rem', padding: '4px 8px' }}
                                    onClick={handleCopyLogs}
                                >
                                    Copiar
                                </Button>
                            </div>
                            <div className={styles.terminal}>
                                {logs.map((log, index) => (
                                    <div key={index} className={styles['log-line']}>{log}</div>
                                ))}
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
                                    {isDeleting ? 'Excluindo...' : 'Excluir'}
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
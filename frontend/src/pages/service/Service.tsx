import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button'; 
import { Input } from '../../components/Input/Input';
import styles from './Service.module.css';
import { Header } from '../../components/Header/Header';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { get_service } from '../../services/utils';
import { useState } from 'react';
import type { ServiceResponse } from '../../types/services';
import axios from 'axios';

export default function ServicePage() {
    const navigation = useNavigate();
    const {showToast} = useToast();

    const {serviceId} = useParams();
    const [service, setService] = useState<ServiceResponse>();
    
    useEffect(() =>{
        fetchService();
    },[]);
    
    const fetchService = async () => {
        try {
            const response = await get_service(Number(serviceId));
            setService(response);
        } catch(err:unknown) {
            if(axios.isAxiosError(err)){
                showToast(err?.response?.data.detail,'error');
                
            }
            else {
                showToast('Unknow Error. Try again.', 'error');
            }
        }
    }


    return (
        <div className={styles['service-page']}>
            <Header isLogout={false}/>
            <main className={styles['service-main']}>
                <header className={styles['service-header']}>
                    <div className={styles['header-title']}>
                        <h1>{service?.name}</h1>
            
                        
                    </div>
                    <div className={styles['header-controls']}>
                        <Button variant="custom" customColor="#475569">Reiniciar</Button>
                        <Button variant="primary">Deploy Manual</Button>
                    </div>
                </header>

                <div className={styles['content-grid']}>
                    {/* Coluna Esquerda: Informações */}
                    <div className={styles['grid-column']}>
                        <section className={styles.card}>
                            <h2>Detalhes do Serviço</h2>
                            <div className={styles['info-list']}>
                                <div className={styles['info-item']}>
                                    <span className={styles['info-label']}>Repositório</span>
                                    <span className={styles['info-value']}>usuario/api-pagamentos</span>
                                </div>
                                <div className={styles['info-item']}>
                                    <span className={styles['info-label']}>Branch</span>
                                    <span className={styles['info-value']}>main</span>
                                </div>
                                <div className={styles['info-item']}>
                                    <span className={styles['info-label']}>Região</span>
                                    <span className={styles['info-value']}>sa-east-1 (São Paulo)</span>
                                </div>
                                <div className={styles['info-item']}>
                                    <span className={styles['info-label']}>URL Pública</span>
                                    <a href="#" className={styles['info-link']}>https://api-pagamentos-prod.mini-heroku.com</a>
                                </div>
                            </div>
                        </section>

                        <section className={styles.card}>
                            <h2>Variáveis de Ambiente</h2>
                            <p className={styles['card-description']}>Gerencie as chaves secretas e configurações da sua aplicação.</p>
                            
                            <div className={styles['env-list']}>
                                {/* Exemplo de variável já existente */}
                                <div className={styles['env-row']}>
                                    <Input defaultValue="NODE_ENV" />
                                    <Input type="password" defaultValue="production" />
                                    <Button variant="danger">Excluir</Button>
                                </div>
                                
                                {/* Linha para adicionar nova variável */}
                                <div className={`${styles['env-row']} ${styles['new-env-row']}`}>
                                    <Input placeholder="NOME_DA_VARIAVEL" />
                                    <Input placeholder="Valor" />
                                    <Button variant="primary">Adicionar</Button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Coluna Direita: Logs e Danger Zone */}
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
                                <Button variant="danger">Excluir</Button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
import { type ButtonHTMLAttributes } from 'react';
import { type ServiceResponse} from '../../types/services';
import './ServiceCard.css'
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    service: ServiceResponse;
    nav_path:string;
}

export function ServiceCard({service,nav_path,...props}: ServiceCardProps) {
    const navigate = useNavigate();
    return (
        <button key={service.id} className="service-card" onClick={() => navigate(nav_path)}>
            <div className="service-card-body">
                <div className="service-icon">🌐</div>
                <div className="service-info">
                    <h3 className="service-name">{service.name}</h3>
                    <p className="service-repo">
                        {service.repo_url 
                            ? `repo ${service.repo_url}` 
                            : 'Repositório não vinculado'}
                    </p>
                </div>
            </div>
            <div className="service-card-footer">
                <div className="service-status">
                    <span className={`status-dot status-${(service.status || 'unknown').toLowerCase()}`}></span>
                    <span className="status-text">{service.status || 'unknown'}</span>
                </div>
                {service.port && (
                    <div className="service-meta">Port: {service.port}</div>
                )}
            </div>
        </button>
    )
};
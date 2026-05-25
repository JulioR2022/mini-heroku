import { type ButtonHTMLAttributes } from 'react';
import { type ServiceResponse} from '../../types/services';
import './ServiceCard.css'

interface ServiceCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    service: ServiceResponse;
}

export function ServiceCard({service,...props}: ServiceCardProps) {
    return (
        <button key={service.id} className="service-card">
            <div className="service-card-body">
                <div className="service-icon">🌐</div>
                <div className="service-info">
                    <h3 className="service-name">{service.name}</h3>
                    <p className="service-repo">
                        {service.repo_url 
                            ? service.repo_url.replace('https://github.com/', '') 
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
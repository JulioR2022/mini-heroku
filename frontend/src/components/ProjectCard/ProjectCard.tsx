import { type ButtonHTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ProjectResponse } from '../../types/project';
import './ProjectCard.css'

interface ProjectCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    project: ProjectResponse;
}

export function ProjectCard({project, ...props}: ProjectCardProps) {
    const navigate = useNavigate();

    return (
        <button 
            key={project.id} 
            className="project-card"
            onClick={() => navigate(`/projects/${project.name}`)}
            {...props}
        >
            <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <span className="project-date">
                    Criado em: {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </span>
            </div>
            <div className="project-card-footer">
                <span className="open-text">Ver detalhes ➔</span>
            </div>
        </button>
    )
};
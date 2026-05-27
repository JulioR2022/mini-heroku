import {api} from './api';
import { type ProjectRequest, type ProjectResponse } from '../types/project';
import type { ServiceResponse } from '../types/services';

export const get_projects = async(): Promise<ProjectResponse[]> => {
    const response = await api.get('/projects');
    return response.data;
};

export const get_services = async(projectId:number): Promise<ServiceResponse[]> => {
    const response = await api.get(`/service/${projectId}`);
    return response.data;
}

export const get_project = async (projectId:number): Promise<ProjectResponse> =>{
    const response = await api.get(`/project/${projectId}`);
    return response.data;
}

export const createProject = async (project:ProjectRequest): Promise<ProjectResponse> => {
    const response = await api.post('/projects',project);
    return response.data;
};
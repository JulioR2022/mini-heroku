import {api} from './api';
import { type ProjectRequest, type ProjectResponse } from '../types/project';
import type { ServiceResponse, ServiceRequest, EnvVar, ServiceUpdate } from '../types/services';

export const get_all_user_projects = async(): Promise<ProjectResponse[]> => {
    const response = await api.get('/projects/user/projects');
    return response.data;
};

export const get_all_project_services = async(projectId:number): Promise<ServiceResponse[]> => {
    const response = await api.get(`/projects/${projectId}/services`);
    return response.data;
}

export const getProject = async (projectId:number): Promise<ProjectResponse> =>{
    const response = await api.get(`/projects/user/${projectId}`);
    return response.data;
}

export const createProject = async (project:ProjectRequest) => {
    await api.post('/projects',project);
};

export const createService = async (service: ServiceRequest) => {
    await api.post('/service',service);
};

export const getService = async(serviceId: number): Promise<ServiceResponse> => {
    const response = await api.get(`/service/${serviceId}`);
    return response.data;
};

export const deleteService = async(serviceId:number) => {
    await api.delete(`/service/${serviceId}`);
};

export const getServiceEnv = async(serviceId: number): Promise<EnvVar[]> => {
    const response = await api.get(`/service/${serviceId}/env`);
    const envArray: EnvVar[] = Object.entries(response.data).map(
        ([key,value]) => ({
            key: String(key), 
            value:String(value)
    }));
    return envArray;
};

export const updateService = async(serviceId:number,update:ServiceUpdate):Promise<ServiceResponse> => {
    const response = await api.patch(`/service/${serviceId}`, update);
    return response.data;
};

export const triggerDeploy = async(serviceId:number) =>{
    await api.post(`/service/${serviceId}/deploy`);
};

export const streamLogs = (serviceName:string):WebSocket => {
    const ws = new WebSocket(`ws://localhost:8000/ws/logs/${serviceName}`);
    return ws
};
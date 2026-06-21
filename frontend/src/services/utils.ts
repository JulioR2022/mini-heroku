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

export const deleteProject = async (projectId:number) => {
    await api.delete(`/projects/${projectId}`);
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
    if (!response.data || typeof response.data !== 'object') {
        return [];
    }
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

export const triggerDeploy = async(serviceId:number) => {
    await api.post(`/service/${serviceId}/deploy`);
};

export const restartService = async(serviceId:number) => {
    await api.post(`/service/${serviceId}/restart`);
};

export const getUserPlan = async() => {
    const response = await api.get('/user/plan');
    return response.data;
};

export const upgradeAccount = async(accountType: string) => {
    const response = await api.patch('/user/upgrade', { account_type: accountType });
    return response.data;
};

export const streamLogs = (serviceName:string):WebSocket => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/logs/${serviceName}`);
    return ws
};
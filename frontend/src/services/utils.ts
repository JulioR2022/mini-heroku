import {api} from './api';
import { type ProjectResponse } from '../types/project';

export const get_projects = async(): Promise<ProjectResponse[]> => {
    const response = await api.get('/projects');
    return response.data;
};
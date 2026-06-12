import {api} from './api'
import type {UserRequest, UserResponse } from '../types/user' 

export const login = async(data:FormData) => {
    const response = await api.post('/user/login',data);
    return response.data;
};

export const register = async(data:UserRequest): Promise<UserResponse> => {
    const response = await api.post('/user/register',data);
    return response.data;
};

export const me = async(): Promise<UserResponse> => {
    const response = await api.get('/user/me');
    return response.data;
}
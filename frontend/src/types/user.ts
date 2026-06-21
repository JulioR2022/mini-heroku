export interface UserBase {
    name:string;
}

export interface UserRequest extends UserBase {
    password: string;
}

export interface UserResponse extends UserBase {
    id: number;
    account_type: string;
    created_at: string;
}

export interface PlanInfo {
    account_type: string;
    limits: {
        max_services: number;
        max_projects: number;
        mem_limit: string;
        nano_cpus: number;
        label: string;
    };
    usage: {
        projects: number;
        services: number;
    };
}
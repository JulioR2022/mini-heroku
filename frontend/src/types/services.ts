export interface ServiceBase{
    name:string;
    repo_url?:string;
    root_dir?:string;
};

export interface ServiceRequest extends ServiceBase{
    env_vars?:Record<string,string>;
};

export interface ServiceResponse extends ServiceBase{
    id:number;
    port?:number;
    status:string;
    created_at:string;
};
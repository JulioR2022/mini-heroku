export interface ServiceBase{
    name:string;
    repo_url?:string;
    root_dir?:string;
    project_id:Number;
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

export interface ServiceUpdate {
    name?:string;
    repo_url?:string;
    root_dir?:string;
    env_vars?:Record<string,string>;
}

export interface EnvVar {
    key:string;
    value:string;
};
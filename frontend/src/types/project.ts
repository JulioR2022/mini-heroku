export interface ProjectBase{
    name:string;
    repo_url?:string;
    root_dir?:string;
    
}

export interface ProjectRequest extends ProjectBase {
    env_vars?:Record<string,string>;
}

export interface ProjectResponse extends ProjectBase{
    id:number;
    port:[number];
    status:string;
    crated_at:string;
}
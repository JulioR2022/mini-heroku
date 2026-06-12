export interface ProjectBase{
    name:string;
}

export interface ProjectRequest extends ProjectBase {
    
}

export interface ProjectResponse extends ProjectBase{
    id:number;
    created_at:string;
}
export interface DeploymentBase{
    project_id:number;
    status:string;
}

export interface DeploymentRequest {

}

export interface DeploymentResponse {
    id:number;
    created_at:string;
}
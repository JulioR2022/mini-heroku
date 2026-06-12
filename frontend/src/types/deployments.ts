export interface DeploymentBase{
    service_id:number;
    
}

export interface DeploymentRequest {

}

export interface DeploymentResponse extends DeploymentBase {
    id:number;
    status?:string;
    created_at:string;
}
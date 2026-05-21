export interface UserBase {
    name:string;
}

export interface UserRequest extends UserBase {
    password: string;
}

export interface UserResponse extends UserBase {
    id: number;
    created_at: string;
}
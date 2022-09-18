
export interface LoginRequest {
    password: string;
    uniqueId: string;
}

export interface LoginResponse {
    token: string;
    isAdmin: boolean;
}
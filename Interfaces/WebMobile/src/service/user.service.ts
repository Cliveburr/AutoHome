import { Injectable } from "@angular/core";
import { LoginRequest, LoginResponse } from "src/model";
import { ApiPrefixService, ApiService } from "./api.service";

@Injectable()
export class UserService {
    
    private api: ApiPrefixService;

    public constructor(
        apiService: ApiService
    ) {
        this.api = apiService.setApi('/user');
    }

    public login(request: LoginRequest) {
        return this.api.post<LoginResponse>('/login', request)
    }
}
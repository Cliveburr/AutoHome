import { Injectable } from "@angular/core";
import { ApiPrefixService, ApiService } from "./api.service";

@Injectable()
export class UserService {
    
    private api: ApiPrefixService;

    public constructor(
        apiService: ApiService
    ) {
        this.api = apiService.setApi('/user');
    }

    public enter(password: string) {
        return this.api.post('/enter', {
            password
        })
    }
}
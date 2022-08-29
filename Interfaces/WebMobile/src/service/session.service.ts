import { Injectable } from "@angular/core";
import { StoreService } from "./store.service";

@Injectable()
export class SessionService {

    private TOKEN_KEY = 'USERTOKEN';

    public token?: string;

    public constructor(
        public store: StoreService
    ) {
    }

    public initialize(): void {
        this.token = this.store.read<string>(this.TOKEN_KEY);
    }

    public setToken(token: string): void {
        this.token = token;
        this.store.save(this.TOKEN_KEY, token);
    }

    public clearToken(): void {
        delete this.token;
        this.store.delete(this.TOKEN_KEY);
    }
}
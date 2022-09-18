import { Injectable } from "@angular/core";
import { LoginResponse } from "src/model";
import { StoreService } from "./store.service";

@Injectable()
export class SessionService {

    private LOGIN_KEY = 'USERLOGIN';
    private UNIQUE_ID_KEY = 'UNIQUEID';

    public login?: LoginResponse;

    public constructor(
        public store: StoreService
    ) {
    }

    public get isLogged(): boolean {
        return typeof(this.login?.token) !== 'undefined';
    }

    public get isAdmin(): boolean {
        return this.login?.isAdmin ?? false;
    }

    public initialize(): void {
        this.login = this.store.read<LoginResponse>(this.LOGIN_KEY);
    }

    public setLogin(login: LoginResponse): void {
        this.login = login;
        this.store.save(this.LOGIN_KEY, login);
    }

    public clearToken(): void {
        delete this.login;
        this.store.delete(this.LOGIN_KEY);
    }

    public getUniqueId(): string {
        const id = window.localStorage.getItem(this.UNIQUE_ID_KEY);
        if (id) {
            return id;
        } else {
            const newId = btoa(new Date().toString());
            window.localStorage.setItem(this.UNIQUE_ID_KEY, newId);
            return newId;
        }
    }
}
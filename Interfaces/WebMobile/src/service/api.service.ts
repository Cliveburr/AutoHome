import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import { Router } from "@angular/router";
import { SessionService } from "./session.service";

@Injectable()
export class ApiService {

    public constructor(
        private httpClient: HttpClient,
        private router: Router,
        private sessionService: SessionService
    ) {
    }

    public setApi(prefix: string): ApiPrefixService {
        return new ApiPrefixService(this, environment.api, prefix);
    }

    public get<T>(url: string): Promise<T> {
        return firstValueFrom(this.httpClient.get<T>(url, {
            headers: this.makeHeaders()
        }))
        .catch<any>(this.catchUnauthorizedError.bind(this));
    }

    public post<T>(url: string, data: any): Promise<T> {
        return firstValueFrom(this.httpClient.post<T>(url, data, {
            headers: this.makeHeaders()
        }))
        .catch<any>(this.catchUnauthorizedError.bind(this));
    }

    private makeHeaders(): { [header: string]: string | string[] } {
        const headers = <any>{
            "Content-Type": "application/json"
        };
        if (this.sessionService.login?.token)
        {
            headers.Authorization = 'Bearer ' + this.sessionService.login.token;
        }
        return headers;
    }

    private catchUnauthorizedError(error: any): void {
        if (error instanceof HttpErrorResponse) {
            if (error.status == 401) {
                this.sessionService.clearToken();
                this.router.navigateByUrl('/login');
            }
        }
        throw error;
    }
}

export class ApiPrefixService {

    private prefixUrl: string;

    public constructor(
        public apiClient: ApiService,
        apiUrl: string,
        prefix: string
    ) {
        this.prefixUrl = this.setUrl(apiUrl, prefix);
    }

    private setUrl(apiUrl: string, prefix: string): string {
        return apiUrl + prefix;
    }

    public get<T>(url: string): Promise<T> {
        return this.apiClient.get<T>(this.prefixUrl + url);
    }

    public post<T>(url: string, data: any): Promise<T> {
        return this.apiClient.post<T>(this.prefixUrl + url, data);
    }
}
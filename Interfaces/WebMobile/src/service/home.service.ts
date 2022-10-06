import { Injectable } from "@angular/core";
import { InitRequest, InitResponse } from "src/model";
import { ApiPrefixService, ApiService } from "./api.service";
import { StoreService } from "./store.service";

@Injectable()
export class HomeService {
    
    private HOME_CACHE_KEY = 'HOMECACHE';
    private api: ApiPrefixService;

    public constructor(
        apiService: ApiService,
        public store: StoreService
    ) {
        this.api = apiService.setApi('/home');
    }

    public async init(): Promise<InitResponse> {
        const storedCache = this.store.read<InitResponse>(this.HOME_CACHE_KEY);
        const res = await this.api.post<InitResponse | undefined>('/init', <InitRequest>{
            cacheDate: storedCache?.cacheDate
        })
        if (res) {
            this.store.save(this.HOME_CACHE_KEY, res);
            return res;
        }
        else {
            return storedCache!;
        }
    }
}
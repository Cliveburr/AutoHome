import { Injectable } from "@angular/core";
import { BolleanRequest, ModuleModel, UintRequest } from "src/model";
import { ApiPrefixService, ApiService } from "../api.service";

@Injectable()
export class CellingFanService {
    
    private api: ApiPrefixService;

    public constructor(
        apiService: ApiService
    ) {
        this.api = apiService.setApi('/cellingfan');
    }

    public refreshDiscovery() {
        return this.api.get('/refreshdiscovery')
    }

    public setLight(req: BolleanRequest) {
        return this.api.post<void>('/setlight', req)
    }

    public setFan(req: BolleanRequest) {
        return this.api.post<void>('/setfan', req)
    }

    public setFanUp(req: BolleanRequest) {
        return this.api.post<void>('/setfanup', req)
    }

    public setFanSpeed(req: UintRequest) {
        return this.api.post<void>('/setfanspeed', req)
    }
}
import { Injectable } from "@angular/core";
import { BolleanRequest, CellingFanState, ModuleModel, UidRequest, UintRequest } from "src/model";
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
        return this.api.post<CellingFanState>('/setlight', req)
    }

    public setFan(req: BolleanRequest) {
        return this.api.post<CellingFanState>('/setfan', req)
    }

    public setFanUp(req: BolleanRequest) {
        return this.api.post<CellingFanState>('/setfanup', req)
    }

    public setFanSpeed(req: UintRequest) {
        return this.api.post<CellingFanState>('/setfanspeed', req)
    }

    public getState(moduleModel: ModuleModel) {
        return this.api.post<CellingFanState>('/getstate', moduleModel);
    }
}
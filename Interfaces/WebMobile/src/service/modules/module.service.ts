import { EventEmitter, Injectable } from "@angular/core";
import { ModuleListRequest, ModuleModel } from "src/model";
import { ApiPrefixService, ApiService } from "../api.service";

@Injectable()
export class ModuleService {
    
    public selected?: ModuleModel;
    private api: ApiPrefixService;

    public constructor(
        apiService: ApiService
    ) {
        this.api = apiService.setApi('/module');
    }

    public refreshDiscovery() {
        return this.api.get('/refreshdiscovery')
    }

    public getModuleList(req: ModuleListRequest) {
        return this.api.post<ModuleModel[]>('/modules', req)
    }
}
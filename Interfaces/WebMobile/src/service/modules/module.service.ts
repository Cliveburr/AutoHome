import { EventEmitter, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ModuleListRequest, ModuleModel } from "src/model";
import { ApiPrefixService, ApiService } from "../api.service";

@Injectable()
export class ModuleService {
    
    public selected?: ModuleModel;
    private api: ApiPrefixService;

    public constructor(
        private router: Router,
        apiService: ApiService
    ) {
        this.api = apiService.setApi('/module');
    }

    public navigateToModuleHome(model: ModuleModel): void {
        switch (model.moduleType) {
            case 'CellingFan':
                this.selected = model;
                this.router.navigateByUrl('/cellingfan');
                break;
            default:
                throw 'Invalid module type: ' + model.moduleType;
        }
    }

    public refreshDiscovery() {
        return this.api.get('/refreshdiscovery')
    }

    public getModuleList(req: ModuleListRequest) {
        return this.api.postnl<ModuleModel[]>('/modules', req)
    }

    public getModuleByUID(uid: number) {
        return this.api.get<ModuleModel>(`/getmodule/${uid}`);
    }
}
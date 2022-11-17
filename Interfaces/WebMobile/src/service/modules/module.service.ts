import { EventEmitter, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ModuleListRequest, ModuleModel } from "src/model";
import { ApiPrefixService, ApiService } from "../api.service";

@Injectable()
export class ModuleService {
    
    public selectedEvent: EventEmitter<ModuleModel>;
    private inSelected?: ModuleModel;
    private api: ApiPrefixService;

    public constructor(
        private router: Router,
        apiService: ApiService
    ) {
        this.api = apiService.setApi('/module');
        this.selectedEvent = new EventEmitter<ModuleModel>();
    }

    public get selected(): ModuleModel | undefined {
        return this.inSelected;
    }
    public set selected(value: ModuleModel | undefined) {
        this.inSelected = value;
        this.selectedEvent.emit(value);
    }

    public navigateToModuleHome(model: ModuleModel): void {
        switch (model.moduleType) {
            case 'CellingFan':
                this.inSelected = model;
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
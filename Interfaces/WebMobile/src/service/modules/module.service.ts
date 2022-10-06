import { EventEmitter, Injectable } from "@angular/core";
import { ModuleListRequest, ModuleModel } from "src/model";
import { ApiPrefixService, ApiService } from "../api.service";

@Injectable()
export class ModuleService {
    
    public selectedEvent: EventEmitter<ModuleModel>;
    private inSelected?: ModuleModel;
    private api: ApiPrefixService;

    public constructor(
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

    public refreshDiscovery() {
        return this.api.get('/refreshdiscovery')
    }

    public getModuleList(req: ModuleListRequest) {
        return this.api.post<ModuleModel[]>('/modules', req)
    }

    public getModuleByUID(uid: number) {
        return this.api.get<ModuleModel>(`/getmodule/${uid}`);
    }
}
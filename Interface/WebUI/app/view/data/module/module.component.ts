import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { ModuleModel, ModuleType } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleComponent implements OnInit {
    public modules: ModuleModel[];
    public moduleType = ModuleType;

    public constructor(
        private base: BaseView,
        private moduleService: ModuleService
    ) {
    }

    public ngOnInit(): void {
        this.onRefresh();
    }

    public onRefresh(): void {
        this.moduleService
            .get()
            .then((data) => this.modules = data);
    }

    public onDiscovery(): void {
        this.moduleService
            .discovery();
    }

    public onDelete(module: ModuleModel): void {
        this.moduleService
            .delete(module.id)
            .then(() => this.onRefresh());
    }

    public onBack(): void {
        this.base.back();
    }    
}
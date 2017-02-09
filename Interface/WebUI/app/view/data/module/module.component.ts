import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { IndexViewModel, IndexModule, ModuleType } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleComponent implements OnInit {
    public model: IndexViewModel;
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
            .getIndex()
            .then((data) => this.model = data);
    }

    public onDiscovery(): void {
        this.moduleService
            .discovery();
    }

    public onDelete(module: IndexModule): void {
        this.moduleService
            .delete(module.moduleId)
            .then(() => this.onRefresh());
    }

    public onBack(): void {
        this.base.back();
    }    
}
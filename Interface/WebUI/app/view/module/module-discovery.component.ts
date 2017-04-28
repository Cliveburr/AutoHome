import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { ConfigurationViewModel, ModuleType } from '../../model/moduleModel';
import { ModuleService } from '../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module-discovery.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleDiscoveryComponent /*implements OnInit */{

    public moduleType = ModuleType;
    public model: ConfigurationViewModel;

    public constructor(
        private base: BaseView,
        private moduleService: ModuleService
    ) {
    }

    public onDiscovery(): void {
        this.moduleService
            .discovery()
            .then((data) => this.model = data);
    }

    public onApply(): void {
        // this.moduleService
        //     .postConfiguration(this.model);
    }

    public onReset(): void {
        this.moduleService
            .postReset();
    }

    public onBack(): void {
        this.base.back();
    }    
}
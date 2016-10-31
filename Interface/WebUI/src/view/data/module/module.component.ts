import { Component, OnInit } from '@angular/core';
import { ModuleModel } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module.component.html',
  styleUrls: [  ]
})
export class ModuleComponent implements OnInit {
    public modules: ModuleModel[];

    public constructor(
        private moduleService: ModuleService
    ) {
    }

    public ngOnInit(): void {
        this.moduleService
            .get()
            .then((data) => this.modules = data);
    }
}
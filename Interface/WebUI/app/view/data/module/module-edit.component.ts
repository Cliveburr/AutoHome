import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { ModuleModel } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module-edit.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleEditComponent implements OnInit {
    public module: ModuleModel;
    public id: string;

    public constructor(
        private base: BaseView,
        private moduleService: ModuleService
    ) {
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        this.moduleService
            .getByID(this.id)
            .then((data) =>
                this.module = data);
    }

    public onSave(): void {
        this.moduleService
            .update(this.module)
            .then(() => this.base.router.navigateByUrl('/data/module'));
    }

    public onBack(): void {
        this.base.back();
    }  
}
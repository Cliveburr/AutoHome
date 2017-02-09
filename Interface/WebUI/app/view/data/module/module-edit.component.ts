import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { EditViewModel } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module-edit.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleEditComponent implements OnInit {
    public model: EditViewModel;
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
            .getEdit(this.id)
            .then((data) => this.model = data);
    }

    public onSave(): void {
        this.moduleService
            .postEdit(this.model)
            .then(() => this.base.router.navigateByUrl('/data/module'));
    }

    public onBack(): void {
        this.base.back();
    }  
}
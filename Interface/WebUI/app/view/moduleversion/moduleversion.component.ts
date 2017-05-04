import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { ModuleType } from '../../model/moduleModel';
import { IndexViewModel, IndexModule } from '../../model/moduleversion.model';
import { ModuleVersionService } from '../../service/moduleversion.service';

@Component({
  moduleId: module.id,
  templateUrl: 'moduleversion.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleVersionComponent implements OnInit {

    public moduleType = ModuleType;
    public model: IndexViewModel;

    public constructor(
        private base: BaseView,
        private moduleVersionService: ModuleVersionService
    ) {
    }

    public ngOnInit(): void {
        this.onRefresh();
    }

    public onRefresh(): void {
        this.moduleVersionService
            .getIndex()
            .then((data) => this.model = data);
    }

    public onDelete(module: IndexModule): void {
        this.moduleVersionService
            .delete(module.moduleVersionId)
            .then(() => this.onRefresh());
    }

    public onBack(): void {
        this.base.back();
    }    
}
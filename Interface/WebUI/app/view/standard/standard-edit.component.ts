import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { EditViewModel, StandardType } from '../../model/standardModel';
import { StandardService } from '../../service/standardService';

@Component({
  moduleId: module.id,
  templateUrl: 'standard-edit.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class StandardEditComponent implements OnInit {
    public model: EditViewModel;
    public id: string;
    public types = StandardType;

    public constructor(
        private base: BaseView,
        private standardService: StandardService
    ) {
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        this.standardService
            .getEdit(this.id)
            .then((data) => this.model = data);
    }

    public onSave(): void {
        this.standardService
            .postEdit(this.model)
            .then(() => this.base.router.navigateByUrl('/standard'));
    }

    public onBack(): void {
        this.base.back();
    }
}
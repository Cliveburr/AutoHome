import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { StandardModel, StandardType } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';

@Component({
  moduleId: module.id,
  templateUrl: 'standard.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class StandardComponent implements OnInit {
    public standards: StandardModel[];
    public standardType = StandardType;

    public constructor(
        private base: BaseView,
        private standardService: StandardService
    ) {
    }

    public ngOnInit(): void {
        this.onRefresh();
    }

    public onRefresh(): void {
        this.standardService
            .get()
            .then((data) => this.standards = data);
    }

    public onCreate(): void {
        this.base.router.navigate(['/data/standard', 'create']);
    }

    public onDelete(standard: StandardModel): void {
        this.standardService
            .delete(standard.id)
            .then(() => this.onRefresh());
    }

    public onBack(): void {
        this.base.back();
    }
}
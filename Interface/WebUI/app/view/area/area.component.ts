import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { IndexViewModel, IndexArea } from '../../model/areaModel';
import { AreaService } from '../../service/areaService';

@Component({
  moduleId: module.id,
  templateUrl: 'area.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class AreaComponent implements OnInit {
    public model: IndexViewModel;

    public constructor(
        private base: BaseView,
        private areaService: AreaService
    ) {
    }

    public ngOnInit(): void {
        this.onRefresh();
    }

    public onRefresh(): void {
        this.areaService
            .getIndex()
            .then((data) => this.model = data);
    }

    public onCreate(): void {
        this.base.router.navigate(['/data/area', 'create']);
    }

    public onDelete(area: IndexArea): void {
        this.areaService
            .delete(area.areaId)
            .then(() => this.onRefresh());
    }

    public onBack(): void {
        this.base.back();
    }
}
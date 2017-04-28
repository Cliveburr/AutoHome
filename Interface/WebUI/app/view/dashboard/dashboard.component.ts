import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { AreaViewModel, ModuleItem } from '../../model/areaModel';
import { ModuleType } from '../../model/moduleModel';
import { AreaService } from '../../service/areaService';

@Component({
  moduleId: module.id,
  templateUrl: 'dashboard.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class DashboardComponent implements OnInit {
    public model: AreaViewModel;

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
            .getArea()
            .then((data) => this.model = data);
    }

    public onEdit(module: ModuleItem): void {
        let editorType = '';
        switch (module.type) {
            case ModuleType.ledRibbonRgb: editorType = 'rgblight'; break;
        }
        this.base.router.navigateByUrl(`editor/${editorType}/module/${module.moduleId}`);
    }

    public onBack(): void {
        this.base.back();
    }
}
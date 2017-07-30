import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { EditViewModel } from '../../model/areaModel';
import { AreaService } from '../../service/areaService';

@Component({
  moduleId: module.id,
  templateUrl: 'area-edit.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class AreaEditComponent implements OnInit {
    public model: EditViewModel;
    public id: string;

    public constructor(
        private base: BaseView,
        private areaService: AreaService
    ) {
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        this.areaService
            .getEdit(this.id)
            .then((data) => this.model = data);
    }

    public onSave(): void {
        this.areaService
            .postEdit(this.model)
            .then(() => this.base.router.navigateByUrl('/area'));
    }

    public onBack(): void {
        this.base.back();
    }

    public onAvaliableDrop(e: any): void {
        let item = e.dragData;
        
        this.model.belong.splice(this.model.belong.indexOf(item), 1);
        this.model.avaliable.push(item);
    }

    public onBelongDrop(e: any): void {
        let item = e.dragData;
        
        this.model.avaliable.splice(this.model.avaliable.indexOf(item), 1);
        this.model.belong.push(item);
    }
}
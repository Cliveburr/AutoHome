import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleModel } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module-edit.component.html',
  styleUrls: [  ]
})
export class ModuleEditComponent implements OnInit {
    public module: ModuleModel;
    public uid: number;

    public constructor(
        private moduleService: ModuleService,
        private route: ActivatedRoute,
        private router: Router
    ) {
    }

    public ngOnInit(): void {
        this.route.params.subscribe(params => this.uid = params['uid']);
        this.onRefresh();
    }

    public onRefresh(): void {
        this.moduleService
            .getByUID(this.uid)
            .then((data) => this.module = data);
    }

    public onSave(): void {
        this.moduleService
            .update(this.module)
            .then(() => this.router.navigateByUrl('/data/module'));
    }
}
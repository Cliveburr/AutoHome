import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StandardModel, StandardType } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';

@Component({
  moduleId: module.id,
  templateUrl: 'standard.component.html',
  styleUrls: [  ]
})
export class StandardComponent implements OnInit {
    public standards: StandardModel[];

    public constructor(
        private standardService: StandardService,
        private router: Router
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
        this.router.navigate(['/data/standard', 'create']);
    }

    public onDelete(standard: StandardModel): void {
        this.standardService
            .delete(standard.id)
            .then(() => this.onRefresh());
    }
}


@Component({
    selector: 'standardtype',
    template: `{{text}}`
})
export class StandardTypeComponent implements OnInit {

    public text: string;

    @Input()
    public value: number;

    public ngOnInit(): void {
        this.text = StandardType[this.value];
    }
}
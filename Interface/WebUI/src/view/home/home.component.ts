import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  moduleId: module.id,
  templateUrl: 'home.component.html',
  styleUrls: [  ]
})
export class HomeComponent implements OnInit {
    modules: string[];

    public constructor(
        private router: Router) {
    }

    public ngOnInit(): void {
        this.modules = ['test1', 'test2' ];
    }
}
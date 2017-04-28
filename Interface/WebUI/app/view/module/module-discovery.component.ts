import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { IndexViewModel, IndexModule, ModuleType } from '../../model/moduleModel';
import { ModuleService } from '../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'module-discovery.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleDiscoveryComponent implements OnInit {
}
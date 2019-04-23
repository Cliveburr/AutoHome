import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'main-layout',
  templateUrl: 'main-layout.component.html',
  
})
export class MainLayoutComponent implements OnInit {

  public disabled: boolean = false;
  public status: {isopen: boolean} = {isopen: false};

  @HostBinding('class.app')
  classApp: boolean = true;

  public toggled(open: boolean): void {
    console.log('Dropdown is now: ', open);
  }

  public toggleDropdown($event: MouseEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.status.isopen = !this.status.isopen;
  }

  ngOnInit(): void {}
}

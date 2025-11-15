import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'pagetitle',
  templateUrl: './pagetitle.component.html',
  styleUrls: ['./pagetitle.components.scss']
})
export class PageTitleComponent implements OnInit {

  @Input() title           : string  = "";
  @Input() subtitle        : string  = "";
  @Input() parentModule    : string  = "";
  @Input() actuallyModyle  : string  = "";
  @Input() routeModule     : string  = "";

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    this.setLocalStorage()
  }

  private setLocalStorage() {
    // localStorage.setItem('actuallyModuleParent', this.parentModule)
    // localStorage.setItem('actuallyModuleRoute', this.routeModule)
    // localStorage.setItem('actuallyModule', this.actuallyModyle)
  }
}

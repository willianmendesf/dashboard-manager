import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from './pagetitle.component';

@NgModule({
  imports: [
    CommonModule,
    PageTitleComponent
  ],
  exports: [PageTitleComponent]
})
export class PageTitleModule { }

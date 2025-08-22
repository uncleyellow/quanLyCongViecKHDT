import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VersionHistoryComponent } from './version-history.component';

const routes = [
  {
    path: '',
    component: VersionHistoryComponent
  }
];

@NgModule({
  declarations: [
    VersionHistoryComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class VersionHistoryModule { }

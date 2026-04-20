import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { ModelListComponent } from './model-list.component';
//import {ModelListComponent } from 'model-list'
import { MatIconModule } from '@angular/material/icon';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SharedModule } from 'app/shared/shared.module';
import { FormsModule} from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';

const routes: Route[] = [
  {
      path     : '',
      component: ModelListComponent
  }
];


@NgModule({
  declarations: [
    ModelListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    NgMultiSelectDropDownModule.forRoot(),
    SharedModule,
    RouterModule.forChild(routes),
    TranslocoModule
  ]
})
export class ModelListModule { }

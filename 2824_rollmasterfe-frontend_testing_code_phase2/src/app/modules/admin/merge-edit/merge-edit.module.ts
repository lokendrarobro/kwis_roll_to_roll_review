import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { MergeEditComponent } from './merge-edit/merge-edit.component';
import { MatIconModule } from '@angular/material/icon';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SharedModule } from 'app/shared/shared.module';
import { FormsModule} from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { TranslocoModule } from '@ngneat/transloco';
const routes: Route[] = [
  {
      path     : '',
      component: MergeEditComponent
  }
];


@NgModule({
  declarations: [
    MergeEditComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    NgMultiSelectDropDownModule.forRoot(),
    SharedModule,
    RouterModule.forChild(routes),
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
    TranslocoModule
  ]
})
export class MergeEditModule { }

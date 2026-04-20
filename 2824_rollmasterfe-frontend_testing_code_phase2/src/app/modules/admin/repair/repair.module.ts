import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepairComponent } from './repair/repair.component';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NgxTouchKeyboardModule }  from 'ngx-touch-keyboard';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import { TranslocoModule } from '@ngneat/transloco';

const routes: Route[] = [
  {
      path     : '',
      component: RepairComponent
  }
];


@NgModule({
  declarations: [
    RepairComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    NgMultiSelectDropDownModule.forRoot(),
    SharedModule,
    NgxTouchKeyboardModule,
    RouterModule.forChild(routes),
    NgxEchartsModule.forRoot({ echarts }),
    TranslocoModule
  ]
})
export class RepairModule { }

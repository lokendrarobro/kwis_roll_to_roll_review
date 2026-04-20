import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleWidthComponent } from './role-width/role-width.component';
import { Route, RouterModule } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import { SharedModule } from 'app/shared/shared.module';
import { FormsModule} from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { TranslocoModule } from '@ngneat/transloco';


const routes: Route[] = [
  {
      path     : '',
      component: RoleWidthComponent
  }
];


@NgModule({
  declarations: [
    RoleWidthComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    RouterModule.forChild(routes),
    NgxEchartsModule.forRoot({ echarts }),
    DataTablesModule,
    TranslocoModule
  ]
})
export class RoleWidthModule {
  chartOptionLine: any;


 }

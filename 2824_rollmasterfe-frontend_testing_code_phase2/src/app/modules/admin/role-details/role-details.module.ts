import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { RoleDetailsComponent } from './role-details/role-details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@ngneat/transloco';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'app/shared/shared.module';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatNativeDateModule} from '@angular/material/core';
import {DataTablesModule} from 'angular-datatables';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

const routes: Route[] = [
  {
      path     : '',
      component: RoleDetailsComponent
  }
];

@NgModule({
  declarations: [
    RoleDetailsComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRippleModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    NgApexchartsModule,
    DataTablesModule,
    TranslocoModule,
    SharedModule,
    RouterModule.forChild(routes),
    NgMultiSelectDropDownModule.forRoot(),
    NgxEchartsModule.forRoot({ echarts }),
    ReactiveFormsModule
  ]
})
export class RoleDetailsModule { }

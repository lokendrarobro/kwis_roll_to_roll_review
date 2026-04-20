import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SettingsComponent } from "./settings.component";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Route, RouterModule } from "@angular/router";
import { NgxTouchKeyboardModule }  from 'ngx-touch-keyboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslocoModule } from "@ngneat/transloco";

const routes: Route[] = [
  {
    path: "",
    component: SettingsComponent,
  },
];

@NgModule({
  declarations: [SettingsComponent],
  
  imports: [CommonModule, MatIconModule, RouterModule.forChild(routes), FormsModule,ReactiveFormsModule, NgMultiSelectDropDownModule.forRoot(),NgxTouchKeyboardModule,DragDropModule, TranslocoModule],
})
export class SettingsModule {}

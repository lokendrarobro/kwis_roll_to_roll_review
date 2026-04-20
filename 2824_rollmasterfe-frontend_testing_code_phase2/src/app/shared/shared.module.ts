import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PhoneMaskDirective } from 'app/phone-mask.directive';

@NgModule({
    declarations: [
        PhoneMaskDirective,
    ],

    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PhoneMaskDirective
    ]
})
export class SharedModule
{
}

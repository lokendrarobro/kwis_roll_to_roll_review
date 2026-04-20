import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeEditComponent } from './merge-edit.component';

describe('MergeEditComponent', () => {
  let component: MergeEditComponent;
  let fixture: ComponentFixture<MergeEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MergeEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MergeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

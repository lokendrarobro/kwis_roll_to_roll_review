import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleWidthComponent } from './role-width.component';

describe('RoleWidthComponent', () => {
  let component: RoleWidthComponent;
  let fixture: ComponentFixture<RoleWidthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoleWidthComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleWidthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

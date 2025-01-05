import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AClassmanagementTabsComponent } from './a-classmanagement-tabs.component';

describe('AClassmanagementTabsComponent', () => {
  let component: AClassmanagementTabsComponent;
  let fixture: ComponentFixture<AClassmanagementTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AClassmanagementTabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AClassmanagementTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimComplaintComponent } from './victim-complaint';

describe('VictimComplaintComponent', () => {
  let component: VictimComplaintComponent;
  let fixture: ComponentFixture<VictimComplaintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimComplaintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimComplaintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

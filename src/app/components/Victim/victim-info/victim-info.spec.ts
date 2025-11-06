import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimInfo } from './victim-info';

describe('VictimInfo', () => {
  let component: VictimInfo;
  let fixture: ComponentFixture<VictimInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimMap } from './victim-map';

describe('VictimMap', () => {
  let component: VictimMap;
  let fixture: ComponentFixture<VictimMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

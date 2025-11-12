import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimProfileComponent } from './victim-profile';

describe('VictimProfile', () => {
  let component: VictimProfileComponent;
  let fixture: ComponentFixture<VictimProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

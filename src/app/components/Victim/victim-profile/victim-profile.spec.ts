import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimProfile } from './victim-profile';

describe('VictimProfile', () => {
  let component: VictimProfile;
  let fixture: ComponentFixture<VictimProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

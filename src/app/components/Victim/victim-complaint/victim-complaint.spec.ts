import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimComplaint } from './victim-complaint';

describe('VictimComplaint', () => {
  let component: VictimComplaint;
  let fixture: ComponentFixture<VictimComplaint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimComplaint]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimComplaint);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

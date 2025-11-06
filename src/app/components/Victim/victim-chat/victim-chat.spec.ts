import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VictimChat } from './victim-chat';

describe('VictimChat', () => {
  let component: VictimChat;
  let fixture: ComponentFixture<VictimChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VictimChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VictimChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

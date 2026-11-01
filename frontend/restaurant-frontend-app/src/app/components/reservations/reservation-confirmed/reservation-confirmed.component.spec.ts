import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_RESERVATION } from '@app/testing/fixtures';

import { ReservationConfirmedComponent } from './reservation-confirmed.component';

describe('ReservationConfirmedComponent', () => {
  let component: ReservationConfirmedComponent;
  let fixture: ComponentFixture<ReservationConfirmedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationConfirmedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationConfirmedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('reservation', TEST_RESERVATION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CardReservationComponent } from './card-reservation.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** A reservation starting `offsetMs` from now, so the tests do not depend on the calendar. */
function reservationStartingIn(offsetMs: number): ReservationCustomer {
  return {
    ...RESERVATION,
    startTime: new Date(Date.now() + offsetMs),
    endTime: new Date(Date.now() + offsetMs + 90 * MINUTE_MS),
  };
}

const RESERVATION: ReservationCustomer = {
  id: 'res-1',
  tableId: 'table-1',
  startTime: new Date(Date.now() + 2 * DAY_MS),
  endTime: new Date(Date.now() + 2 * DAY_MS + 90 * MINUTE_MS),
  guestCount: 2,
  status: ReservationStatusCustomer.Reserved,
  restaurantName: 'Green & Tasty',
  locationAddress: 'Rustaveli Avenue 48',
  waiterId: 'waiter-1',
};

describe('CardReservationComponent', () => {
  let component: CardReservationComponent;
  let fixture: ComponentFixture<CardReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }, provideRouter([])],
      imports: [CardReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardReservationComponent);
    component = fixture.componentInstance;
    // r — обов'язковий input: без нього компонент падає з NG0950
    fixture.componentRef.setInput('r', RESERVATION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Group Pre-Order button', () => {
    function groupOrderButton(): HTMLButtonElement | undefined {
      const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
      return buttons.find((button) => button.textContent?.trim() === 'Group Pre-Order') as
        | HTMLButtonElement
        | undefined;
    }

    it('is shown to the customer for an upcoming reservation with 2+ guests', () => {
      expect(groupOrderButton()).toBeDefined();
    });

    it('is hidden for a single-guest reservation', () => {
      fixture.componentRef.setInput('r', { ...RESERVATION, guestCount: 1 });
      fixture.detectChanges();
      expect(groupOrderButton()).toBeUndefined();
    });

    it('is hidden once the reservation is no longer upcoming', () => {
      fixture.componentRef.setInput('r', { ...RESERVATION, status: ReservationStatusCustomer.Finished });
      fixture.detectChanges();
      expect(groupOrderButton()).toBeUndefined();
    });

    it('opens the group order screen of the reservation', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);

      groupOrderButton()?.click();

      expect(navigate).toHaveBeenCalledWith(['/reservations', 'res-1', 'group-order']);
    });
  });

  describe('customer actions close to or after the start', () => {
    function buttonTexts(): string[] {
      const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
      return buttons.map((button) => button.textContent?.trim() ?? '');
    }

    function showReservation(reservation: ReservationCustomer): void {
      fixture.componentRef.setInput('r', reservation);
      fixture.detectChanges();
    }

    it('offers Cancel, Edit and Pre-order for an upcoming reservation', () => {
      expect(buttonTexts()).toEqual(jasmine.arrayContaining(['Cancel', 'Edit', 'Pre-order']));
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Too late to change');
    });

    it('hides every change action for a reservation that already started', () => {
      showReservation(reservationStartingIn(-2 * DAY_MS));

      const texts = buttonTexts();
      expect(texts).not.toContain('Cancel');
      expect(texts).not.toContain('Edit');
      expect(texts).not.toContain('Pre-order');
      expect(texts).not.toContain('Group Pre-Order');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Too late to change this reservation');
    });

    it('hides the change actions less than 30 minutes before the start', () => {
      showReservation(reservationStartingIn(20 * MINUTE_MS));

      expect(buttonTexts()).not.toContain('Cancel');
      expect(buttonTexts()).not.toContain('Pre-order');
    });

    it('still allows changes 31 minutes before the start', () => {
      showReservation(reservationStartingIn(31 * MINUTE_MS));

      expect(buttonTexts()).toContain('Cancel');
    });

    it('keeps Cancel for the waiter even when the reservation started', () => {
      fixture.componentRef.setInput('role', 'Waiter');
      showReservation(reservationStartingIn(-2 * DAY_MS));

      expect(buttonTexts()).toContain('Cancel');
    });
  });
});

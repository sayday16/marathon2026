import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReservationDashboardComponent } from './reservation-dashboard.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';

describe('ReservationDashboardComponent', () => {
  let component: ReservationDashboardComponent;
  let fixture: ComponentFixture<ReservationDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://test.api' },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [ReservationDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('removing a cancelled reservation from the list', () => {
    const cancelled = { id: 'res-cancelled', status: ReservationStatusCustomer.Cancelled } as ReservationCustomer;
    const active = { id: 'res-active', status: ReservationStatusCustomer.Reserved } as ReservationCustomer;

    beforeEach(() => {
      component.customerId.set('customer-test');
      localStorage.removeItem('dismissedReservations:customer-test');
      component.reservations.set([cancelled, active]);
    });

    afterEach(() => localStorage.removeItem('dismissedReservations:customer-test'));

    it('hides only the removed reservation', () => {
      component.dismissReservation('res-cancelled');

      expect(component.visibleReservations().map((reservation) => reservation.id)).toEqual(['res-active']);
    });

    it('remembers the choice for the customer in this browser', () => {
      component.dismissReservation('res-cancelled');

      expect(JSON.parse(localStorage.getItem('dismissedReservations:customer-test') ?? '[]')).toEqual(['res-cancelled']);
    });
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WaiterDashboardComponent } from './waiter-dashboard.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';

describe('WaiterDashboardComponent', () => {
  let component: WaiterDashboardComponent;
  let fixture: ComponentFixture<WaiterDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://test.api' },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [WaiterDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WaiterDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('changing the status of a reservation', () => {
    it('shows the new status on the card although the API answers with a message only', () => {
      const httpMock = TestBed.inject(HttpTestingController);
      component.reservations.set([
        { id: 'res-1', status: ReservationStatusCustomer.Reserved },
        { id: 'res-2', status: ReservationStatusCustomer.Reserved },
      ] as ReservationCustomer[]);

      component.onReservationStatusChanged({ id: 'res-1', newStatus: ReservationStatusCustomer.InProgress });

      const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/reservations/res-1/status'));
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ newStatus: ReservationStatusCustomer.InProgress });
      request.flush({ message: 'Reservation status updated successfully.' });

      expect(component.reservations().map((reservation) => reservation.status)).toEqual([
        ReservationStatusCustomer.InProgress,
        ReservationStatusCustomer.Reserved,
      ]);
    });

    it('tells the reason the API gives when it rejects the change', () => {
      const httpMock = TestBed.inject(HttpTestingController);
      const toast = spyOn(component['toast'], 'error');
      component.reservations.set([{ id: 'res-1', status: ReservationStatusCustomer.InProgress }] as ReservationCustomer[]);

      component.onReservationStatusChanged({ id: 'res-1', newStatus: ReservationStatusCustomer.Finished });
      httpMock
        .expectOne((candidate) => candidate.url.endsWith('/reservations/res-1/status'))
        .flush(
          { error: 'Cannot complete reservation without feedback or an order.' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(toast).toHaveBeenCalledWith('Cannot complete reservation without feedback or an order.', 'Reservation');
    });

    it('keeps the status when the API rejects the change', () => {
      const httpMock = TestBed.inject(HttpTestingController);
      component.reservations.set([{ id: 'res-1', status: ReservationStatusCustomer.Reserved }] as ReservationCustomer[]);

      component.onReservationStatusChanged({ id: 'res-1', newStatus: ReservationStatusCustomer.InProgress });
      httpMock
        .expectOne((candidate) => candidate.url.endsWith('/reservations/res-1/status'))
        .flush({ error: 'Cannot update' }, { status: 400, statusText: 'Bad Request' });

      expect(component.reservations()[0].status).toBe(ReservationStatusCustomer.Reserved);
    });
  });

  describe('loading the reservations', () => {
    const CANCELLED = 1;
    const RESERVED = 0;

    function reservation(index: number, status: number): Record<string, unknown> {
      return {
        id: `res-${index}`,
        tableId: 'table-1',
        customerId: `customer-${index}`,
        waiterId: 'waiter-1',
        guestCount: 2,
        status,
        locationAddress: 'TEST 1 Test Street, Kyiv',
        startTime: '2027-01-01T10:00:00Z',
        endTime: '2027-01-01T11:30:00Z',
      };
    }

    function load(httpMock: HttpTestingController, reservations: Record<string, unknown>[]): void {
      httpMock.match(() => true);
      component['loadReservations']();
      httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/reservations')).flush(reservations);
    }

    it('does not load the cancelled reservations', () => {
      const httpMock = TestBed.inject(HttpTestingController);

      load(httpMock, [reservation(0, CANCELLED), reservation(1, RESERVED)]);

      const urls = httpMock.match(() => true).map((request) => request.request.url);
      expect(urls.some((url) => url.includes('res-0'))).toBeFalse();
      expect(urls.some((url) => url.includes('res-1'))).toBeTrue();
    });

    it('sends the requests of a few cards at a time, not of every card at once', () => {
      const httpMock = TestBed.inject(HttpTestingController);

      load(httpMock, Array.from({ length: 20 }, (_, index) => reservation(index, RESERVED)));

      // 20 cards need 60 requests; only the first cards (three requests each) are sent now.
      expect(httpMock.match(() => true).length).toBeLessThanOrEqual(12);
    });
  });
});

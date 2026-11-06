import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { Order } from '@app/models/orders/order.model';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';
import { localizeReservationTime } from '@app/shared/helpers/date-helpers';

import { CartComponent } from './cart.component';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  let preOrdersServiceMock: jasmine.SpyObj<PreOrdersService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    preOrdersServiceMock =
      jasmine.createSpyObj<PreOrdersService>(
        'PreOrdersService',
        [
          'getPreOrders',
          'cancelPreOrderByReservationId',
          'unsubmitPreOrderByReservationId',
          'submitPreOrderByReservationId',
          'editPreOrderByReservationId',
        ],
      );

    routerMock = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate'],
    );

    preOrdersServiceMock.getPreOrders.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        {
          provide: PreOrdersService,
          useValue: preOrdersServiceMock,
        },
        {
          provide: Router,
          useValue: routerMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the time of an order in the local time, like the rest of the site', () => {
    preOrdersServiceMock.getPreOrders.and.returnValue(
      of([
        {
          orderId: 'order-1',
          status: 0,
          reservationId: 'res-1',
          reservationAddress: 'TEST 1 Test Street, Kyiv',
          reservationTime: 'Nov 02, 2026, 4:15 PM - 5:45 PM',
          orderItems: [],
        },
      ] as unknown as Order[]),
    );

    fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.orders()[0].reservationTime).toBe(
      localizeReservationTime('Nov 02, 2026, 4:15 PM - 5:45 PM'),
    );
  });

  it('should emit closeCartEvent when closeCart is called', () => {
    spyOn(component.closeCartEvent, 'emit');

    component.closeCart();

    expect(
      component.closeCartEvent.emit,
    ).toHaveBeenCalled();
  });

  it('should return submitted orders with statuses 1 and 3', () => {
    component.orders.set([
      {
        orderId: 'order-1',
        status: 1,
      },
      {
        orderId: 'order-2',
        status: 2,
      },
      {
        orderId: 'order-3',
        status: 3,
      },
      {
        orderId: 'order-4',
        status: 0,
      },
    ] as Order[]);

    expect(
      component
        .submittedOrders()
        .map((order) => order.status),
    ).toEqual([1, 3]);
  });

  it('should return unsubmitted orders with status 0', () => {
    component.orders.set([
      {
        orderId: 'order-1',
        status: 0,
      },
      {
        orderId: 'order-2',
        status: 1,
      },
      {
        orderId: 'order-3',
        status: 3,
      },
    ] as Order[]);

    expect(
      component
        .unsubmittedOrders()
        .map((order) => order.status),
    ).toEqual([0]);
  });

  it('opens the menu in the pre-order mode of the order reservation on Add dish', () => {
    component.orders.set([
      {
        orderId: 'order-1',
        status: 0,
        reservationId: 'res-1',
        reservationAddress: 'TEST 1 Test Street, Kyiv',
        reservationTime: 'Nov 02, 2026, 4:15 PM - 5:45 PM',
      },
    ] as Order[]);

    component.addDishToOrder('order-1');

    expect(routerMock.navigate).toHaveBeenCalledWith(['/menu'], {
      queryParams: {
        preOrder: 'true',
        reservationId: 'res-1',
        reservationLabel: 'TEST 1 Test Street, Kyiv, Nov 02, 2026, 4:15 PM - 5:45 PM',
      },
    });
  });

  it('should navigate to reservations when goToReservations is called', () => {
    component.goToReservations();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/reservations',
    ]);
  });
});

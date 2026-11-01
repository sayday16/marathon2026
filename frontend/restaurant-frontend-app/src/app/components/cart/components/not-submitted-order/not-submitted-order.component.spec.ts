import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { Order } from '@app/models/orders/order.model';

import { NotSubmittedOrderComponent } from './not-submitted-order.component';

describe('NotSubmittedOrderComponent', () => {
  let component: NotSubmittedOrderComponent;
  let fixture: ComponentFixture<NotSubmittedOrderComponent>;

  const order = {
    orderId: 'order-1',
    status: 0,
    reservationId: 'res-1',
    reservationAddress: 'Test address',
    reservationTime: '2026-09-07T12:15:00Z',
    orderItems: [
      {
        quantity: 2,
        dish: {
          id: 'dish-1',
          price: 10,
        },
      },
    ],
  } as Order;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotSubmittedOrderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      NotSubmittedOrderComponent,
    );

    component = fixture.componentInstance;

    fixture.componentRef.setInput('order', order);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit submitted with the order ID', () => {
    spyOn(component.submitted, 'emit');

    component.submit();

    expect(
      component.submitted.emit,
    ).toHaveBeenCalledWith('order-1');
  });

  it('should calculate the total price', () => {
    expect(component.totalPrice()).toBe(20);
  });

  describe('dish image', () => {
    function imageSource(): string | null {
      return (fixture.nativeElement as HTMLElement)
        .querySelector('.order-item-dish .dish-image')
        ?.getAttribute('src') ?? null;
    }

    it('shows the placeholder when the API returns no image', () => {
      expect(imageSource()).toBe('assets/img/dish.png');
    });

    it('shows the image of the dish when there is one', () => {
      fixture.componentRef.setInput('order', {
        ...order,
        orderItems: [{ quantity: 1, dish: { id: 'dish-1', price: 10, imageUrl: 'https://img.test/tom-yum.jpg' } }],
      } as Order);
      fixture.detectChanges();

      expect(imageSource()).toBe('https://img.test/tom-yum.jpg');
    });
  });
});

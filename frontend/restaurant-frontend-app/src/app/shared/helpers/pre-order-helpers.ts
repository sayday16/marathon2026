import { Params } from '@angular/router';

export interface PreOrderReservation {
  id: string;
  tableId: string;
  tableName?: string;
  locationAddress: string;
  startTime: Date | string;
  endTime: Date | string;
}

export interface PreOrderOrder {
  reservationId: string;
  reservationAddress: string;
  reservationTime: string;
}

/** The same menu mode for an order that already exists (the cart knows its address and time as ready text). */
export function buildPreOrderQueryParamsForOrder(order: PreOrderOrder): Params {
  return {
    preOrder: 'true',
    reservationId: order.reservationId,
    reservationLabel: [order.reservationAddress, order.reservationTime].filter(Boolean).join(', '),
  };
}

/** Query params that switch the menu page into the pre-order mode of one reservation. */
export function buildPreOrderQueryParams(reservation: PreOrderReservation): Params {
  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);

  return {
    preOrder: 'true',
    reservationId: reservation.id,
    // The API does not return the table number, so the table is named only when the caller knows it (never by its id).
    reservationLabel: [
      reservation.locationAddress,
      reservation.tableName,
      startTime.toDateString(),
      `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`,
    ]
      .filter(Boolean)
      .join(', '),
  };
}

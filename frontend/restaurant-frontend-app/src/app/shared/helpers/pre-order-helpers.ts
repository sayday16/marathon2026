import { Params } from '@angular/router';

export interface PreOrderReservation {
  id: string;
  tableId: string;
  tableName?: string;
  locationAddress: string;
  startTime: Date | string;
  endTime: Date | string;
}

/** Query params that switch the menu page into the pre-order mode of one reservation. */
export function buildPreOrderQueryParams(reservation: PreOrderReservation): Params {
  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);
  const tableLabel = reservation.tableName || `Table ${reservation.tableId}`;

  return {
    preOrder: 'true',
    reservationId: reservation.id,
    reservationLabel: [
      reservation.locationAddress,
      tableLabel,
      startTime.toDateString(),
      `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`,
    ].join(', '),
  };
}

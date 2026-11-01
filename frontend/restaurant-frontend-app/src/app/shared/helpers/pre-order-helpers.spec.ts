import { buildPreOrderQueryParams, PreOrderReservation } from './pre-order-helpers';

const RESERVATION: PreOrderReservation = {
  id: 'res-1',
  tableId: 'table-1',
  locationAddress: '48 Rustaveli Avenue',
  startTime: new Date(2026, 10, 3, 16, 45),
  endTime: new Date(2026, 10, 3, 18, 15),
};

describe('buildPreOrderQueryParams', () => {
  it('switches the menu to the pre-order mode of the reservation', () => {
    const params = buildPreOrderQueryParams(RESERVATION);

    expect(params['preOrder']).toBe('true');
    expect(params['reservationId']).toBe('res-1');
  });

  it('describes the reservation by address, table, date and time', () => {
    const label = buildPreOrderQueryParams(RESERVATION)['reservationLabel'] as string;

    expect(label).toContain('48 Rustaveli Avenue');
    expect(label).toContain('Table table-1');
    expect(label).toContain(new Date(2026, 10, 3).toDateString());
  });

  it('prefers the table name to the table id', () => {
    const label = buildPreOrderQueryParams({ ...RESERVATION, tableName: 'Window 4' })['reservationLabel'] as string;

    expect(label).toContain('Window 4');
    expect(label).not.toContain('table-1');
  });

  it('accepts dates that came from JSON as strings', () => {
    const params = buildPreOrderQueryParams({
      ...RESERVATION,
      startTime: '2026-11-03T16:45:00Z',
      endTime: '2026-11-03T18:15:00Z',
    });

    expect(params['reservationLabel']).not.toContain('Invalid Date');
  });
});

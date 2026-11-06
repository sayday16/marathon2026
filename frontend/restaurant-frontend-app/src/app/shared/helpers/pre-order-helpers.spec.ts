import { buildPreOrderQueryParams, buildPreOrderQueryParamsForOrder, PreOrderReservation } from './pre-order-helpers';

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

  it('describes the reservation by address, date and time, and never shows the table id', () => {
    const label = buildPreOrderQueryParams(RESERVATION)['reservationLabel'] as string;

    expect(label).toContain('48 Rustaveli Avenue');
    expect(label).toContain(new Date(2026, 10, 3).toDateString());
    expect(label).not.toContain('table-1');
    expect(label).not.toContain('Table');
  });

  it('names the table when the caller knows it', () => {
    const label = buildPreOrderQueryParams({ ...RESERVATION, tableName: 'Table 4' })['reservationLabel'] as string;

    expect(label).toContain('48 Rustaveli Avenue, Table 4, ');
    expect(label).not.toContain('table-1');
  });

  it('builds the same mode for an order from its address and time text', () => {
    const params = buildPreOrderQueryParamsForOrder({
      reservationId: 'res-9',
      reservationAddress: 'TEST 1 Test Street, Kyiv',
      reservationTime: 'Nov 02, 2026, 4:15 PM - 5:45 PM',
    });

    expect(params).toEqual({
      preOrder: 'true',
      reservationId: 'res-9',
      reservationLabel: 'TEST 1 Test Street, Kyiv, Nov 02, 2026, 4:15 PM - 5:45 PM',
    });
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

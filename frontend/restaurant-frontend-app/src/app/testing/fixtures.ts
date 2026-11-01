import { UserModel } from '@app/auth/models/user.model';
import { DishListResponse } from '@app/models/dishes/dish-list-response.model';
import { Reservation, ReservationStatus } from '@app/models/reservations/reservation.model';
import { Table } from '@app/models/tables/table.model';
import { TimeRange } from '@app/models/tables/time-range.model';
import { Roles } from '@app/shared/constants/roles';

/** Shared fixtures for component specs that need required inputs. */
export const TEST_TIME_RANGE: TimeRange = {
  start: '2026-10-31T10:00:00.000Z',
  end: '2026-10-31T11:30:00.000Z',
};

export const TEST_TABLE: Table = {
  id: 'table-1',
  tableNumber: 1,
  locationId: 'location-1',
  capacity: 4,
  timeRanges: [TEST_TIME_RANGE],
};

export const TEST_DISH: DishListResponse = {
  id: 'dish-1',
  name: 'Caesar Salad',
  imageUrl: 'assets/img/dishes/spring-salad.jpg',
  price: 180,
  state: 'Available',
  weight: '250 g',
  dishType: 'Appetizer',
  description: 'Test dish',
  calories: '300',
  proteins: '10',
  carbohydrates: '20',
  fats: '10',
  vitamins: 'C',
};

export const TEST_RESERVATION: Reservation = {
  id: 'reservation-1',
  tableId: TEST_TABLE.id,
  customerId: 'customer-1',
  startTime: new Date('2026-10-31T10:00:00.000Z'),
  endTime: new Date('2026-10-31T11:30:00.000Z'),
  guestCount: 2,
  status: ReservationStatus.Reserved,
  locationAddress: 'Rustaveli Avenue 48',
  tableCapacity: 4,
  restaurantName: 'Green & Tasty',
  waiterId: 'waiter-1',
};

export const TEST_WAITER: UserModel = {
  id: 'waiter-1',
  firstName: 'Test',
  lastName: 'Waiter',
  email: 'waiter@example.test',
  role: Roles.WAITER,
};

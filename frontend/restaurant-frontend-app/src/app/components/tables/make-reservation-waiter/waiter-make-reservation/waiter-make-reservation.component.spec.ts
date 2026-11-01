import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaiterMakeReservationComponent } from './waiter-make-reservation.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { of } from 'rxjs';
import { Table } from '@app/models/tables/table.model';
import { TableService } from '@app/services/table/table.service';

describe('WaiterMakeReservationComponent', () => {
  let component: WaiterMakeReservationComponent;
  let fixture: ComponentFixture<WaiterMakeReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }],
      imports: [WaiterMakeReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WaiterMakeReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('free times of the selected table', () => {
    const TABLE = { id: 'table-1', tableNumber: 1, capacity: 8 } as Table;
    const SLOT = { start: '2026-11-03T10:00:00', end: '2026-11-03T11:30:00' };

    beforeEach(() => {
      component.selectedTable = TABLE;
    });

    it('looks at the next days when there is nothing free today', () => {
      const slots = spyOn(TestBed.inject(TableService), 'getTableTimeSlots').and.returnValues(
        of([]),
        of([]),
        of([SLOT]),
      );

      component.loadTimeSlotsForSelectedTable();

      expect(slots).toHaveBeenCalledTimes(3);
      expect(component.availableTimeSlots).toEqual([SLOT]);
      expect(component.selectedStartTime).toBe(SLOT.start);
      expect(component.slotsDate).toContain('2026');
      expect(component.noSlotsAhead).toBeFalse();
    });

    it('says so when there is no free time on the days ahead', () => {
      const slots = spyOn(TestBed.inject(TableService), 'getTableTimeSlots').and.returnValue(of([]));

      component.loadTimeSlotsForSelectedTable();

      expect(slots).toHaveBeenCalledTimes(15);
      expect(component.availableTimeSlots).toEqual([]);
      expect(component.noSlotsAhead).toBeTrue();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_TABLE, TEST_TIME_RANGE } from '@app/testing/fixtures';

import { MakeReservationComponent } from './make-reservation.component';

describe('MakeReservationComponent', () => {
  let component: MakeReservationComponent;
  let fixture: ComponentFixture<MakeReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MakeReservationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('locationName', 'Rustaveli Avenue 48');
    fixture.componentRef.setInput('table', TEST_TABLE);
    fixture.componentRef.setInput('selectedTimeRange', TEST_TIME_RANGE);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

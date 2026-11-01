import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_TIME_RANGE } from '@app/testing/fixtures';

import { TimeSlotComponent } from './time-slot.component';

describe('TimeSlotComponent', () => {
  let component: TimeSlotComponent;
  let fixture: ComponentFixture<TimeSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSlotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSlotComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('timeRange', TEST_TIME_RANGE);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_TABLE } from '@app/testing/fixtures';

import { TimeSlotsModalComponent } from './time-slots-modal.component';

describe('TimeSlotsModalComponent', () => {
  let component: TimeSlotsModalComponent;
  let fixture: ComponentFixture<TimeSlotsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSlotsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSlotsModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('locationName', 'Rustaveli Avenue 48');
    fixture.componentRef.setInput('table', TEST_TABLE);
    fixture.componentRef.setInput('date', 'Oct 31, 2026');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

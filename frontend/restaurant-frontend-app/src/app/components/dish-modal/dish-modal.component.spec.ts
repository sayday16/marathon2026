import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_DISH } from '@app/testing/fixtures';

import { DishModalComponent } from './dish-modal.component';

describe('DishModalComponent', () => {
  let component: DishModalComponent;
  let fixture: ComponentFixture<DishModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DishModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dish', TEST_DISH);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

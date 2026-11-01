import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackQrModalComponent } from './feedback-qr-modal.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';

describe('FeedbackQrModalComponent', () => {
  let component: FeedbackQrModalComponent;
  let fixture: ComponentFixture<FeedbackQrModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://test.api' },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [FeedbackQrModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackQrModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('says so when the backend gives no feedback link instead of showing an empty code', () => {
    httpMock
      .expectOne((request) => request.url.includes('/feedback/token'))
      .flush('Not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('not available');
    expect(text).not.toContain('Scan to send anonymous feedback');
  });

  it('asks the user to scan the code while the link is being created', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Scan to send anonymous feedback');
  });
});

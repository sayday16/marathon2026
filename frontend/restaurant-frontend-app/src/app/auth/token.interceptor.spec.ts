import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../services/toast/toast.service';
import { AuthenticationService } from './services/authentication.service';
import { SKIP_ERROR_TOAST } from './skip-error-toast.context';
import { tokenInterceptor } from './token.interceptor';

const URL = 'https://test.api/reservations';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['error']);
    const authService = jasmine.createSpyObj<AuthenticationService>('AuthenticationService', [
      'getTokens',
    ]);
    authService.getTokens.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastService },
        { provide: AuthenticationService, useValue: authService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows the server message in a toast for a 400 response', () => {
    http.post(URL, {}).subscribe({ error: () => undefined });

    httpMock
      .expectOne(URL)
      .flush({ message: 'Overlaps' }, { status: 400, statusText: 'Bad Request' });

    expect(toastService.error).toHaveBeenCalledWith('Overlaps', 'Error');
  });

  it('does not show a toast but still rethrows when SKIP_ERROR_TOAST is set', () => {
    let receivedStatus: number | undefined;
    http
      .post(URL, {}, { context: new HttpContext().set(SKIP_ERROR_TOAST, true) })
      .subscribe({ error: (error) => (receivedStatus = error.status) });

    httpMock
      .expectOne(URL)
      .flush({ message: 'Overlaps' }, { status: 400, statusText: 'Bad Request' });

    expect(toastService.error).not.toHaveBeenCalled();
    expect(receivedStatus).toBe(400);
  });

  describe('guest endpoints', () => {
    const GROUP_SESSIONS_URL = 'https://test.api/guest/groups/grp-1/sessions';

    function withTokens(): void {
      const authService = TestBed.inject(AuthenticationService) as jasmine.SpyObj<AuthenticationService>;
      authService.getTokens.and.returnValue({ idToken: 'owner-token', accessToken: 'owner-token' });
    }

    it('sends the Owner token to /guest/groups/{id}/sessions', () => {
      withTokens();
      http.get(GROUP_SESSIONS_URL).subscribe();

      const req = httpMock.expectOne(GROUP_SESSIONS_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer owner-token');
      req.flush({});
    });

    it('sends the Owner token to DELETE /guest/groups/{id}/sessions/{sessionId}', () => {
      withTokens();
      http.delete(`${GROUP_SESSIONS_URL}/gs-2`).subscribe();

      const req = httpMock.expectOne(`${GROUP_SESSIONS_URL}/gs-2`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer owner-token');
      req.flush({});
    });

    it('leaves other guest endpoints untouched (no Owner token)', () => {
      withTokens();
      http.get('https://test.api/guest/groups/grp-1/status').subscribe();

      const req = httpMock.expectOne('https://test.api/guest/groups/grp-1/status');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('does not show a toast for a silent guest request but still rethrows', () => {
      let receivedStatus: number | undefined;
      http
        .get('https://test.api/guest/groups/grp-1/status', { context: new HttpContext().set(SKIP_ERROR_TOAST, true) })
        .subscribe({ error: (error) => (receivedStatus = error.status) });

      httpMock
        .expectOne('https://test.api/guest/groups/grp-1/status')
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

      expect(toastService.error).not.toHaveBeenCalled();
      expect(receivedStatus).toBe(500);
    });
  });
});

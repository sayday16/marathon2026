import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SKIP_ERROR_TOAST } from '@app/auth/skip-error-toast.context';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeedbackQrService {
  private readonly frontendBaseUrl = window.location.origin + '/main';
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  generateFeedbackUrl(
    token: string,
    reservationId: string,
    waiterName: string,
    isNewFeedback: boolean
  ): string {
    const params = new URLSearchParams({
      token,
      reservationId,
      waiterName,
      isNewFeedback: String(isNewFeedback),
    });
    const url = `${this.frontendBaseUrl}?${params.toString()}`;

    return url;
  }

  getAnonymousFeedbackToken(reservationId: string): Observable<string> {
    const url = this.baseUrl + '/feedback/token';
    const params = new URLSearchParams({
      reservationId: reservationId,
    });
    // The window explains a failure itself, so the general error toast is skipped.
    return this.http.get<string>(`${url}?${params.toString()}`, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    });
  }
}

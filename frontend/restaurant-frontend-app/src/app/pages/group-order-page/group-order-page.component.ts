import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, interval, map, Subscription, switchMap } from 'rxjs';
import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';
import { GroupStatusResponse } from '@app/models/group-orders/group-status.model';
import { Participant } from '@app/models/group-orders/participant.model';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { ModalComponent } from '@app/shared/custom-components/modal/modal.component';
import { consolidatePreOrder } from '@app/shared/helpers/consolidate-pre-order';

const SYNC_INTERVAL_MS = 15_000;

type LoadError = 'notFound' | 'failed';

@Component({
  selector: 'app-group-order-page',
  imports: [ParticipantCardComponent, ModalComponent, CurrencyPipe, DatePipe],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groupOrdersService = inject(GroupOrdersService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reservationId = this.route.snapshot.paramMap.get('reservationId') ?? '';
  private syncSubscription?: Subscription;

  readonly invite = signal<GuestInvite | null>(null);
  readonly participants = signal<Participant[]>([]);
  readonly ownerSessionId = signal('');
  readonly groupStatus = signal<GroupStatusResponse | null>(null);

  readonly loading = signal(true);
  readonly loadError = signal<LoadError | null>(null);

  readonly confirmSubmitOpen = signal(false);
  readonly submitting = signal(false);

  readonly removeTarget = signal<Participant | null>(null);
  readonly removing = signal(false);

  readonly updatedAt = signal<Date | null>(null);
  readonly refreshing = signal(false);
  readonly syncFailed = signal(false);

  readonly groupId = computed(() => this.invite()?.GroupReservationId ?? '');
  readonly isOpen = computed(() => this.groupStatus()?.status === 'Open');
  readonly isSent = computed(() => this.groupStatus()?.status === 'Submitted');

  readonly statusLabel = computed(() => {
    switch (this.groupStatus()?.status) {
      case 'Submitted':
        return 'Sent to Restaurant';
      case 'Closed':
        return 'Closed';
      default:
        return 'Collecting pre-orders';
    }
  });

  readonly guestsLabel = computed(() => {
    const joined = this.groupStatus()?.currentParticipants ?? this.participants().length;
    return `${joined} of ${this.invite()?.MaxGuestCount ?? 0} guests`;
  });

  /** Only submitted carts go to the restaurant, so this is what the Owner actually orders. */
  readonly consolidated = computed(() => consolidatePreOrder(this.participants()));
  readonly hasDishes = computed(() => this.participants().some((person) => person.items.length > 0));
  readonly pendingCount = computed(() => this.participants().filter((person) => !person.isSubmitted).length);
  readonly canSubmit = computed(
    () => this.isOpen() && !this.submitting() && this.consolidated().items.length > 0,
  );
  readonly canRemoveGuests = computed(() => this.isOpen() && !this.removing());

  constructor() {
    this.destroyRef.onDestroy(() => this.stopSync());
    this.load();
  }

  load(): void {
    this.stopSync();
    this.loading.set(true);
    this.loadError.set(null);

    this.groupOrdersService
      .getGroupInvite$(this.reservationId)
      .pipe(
        switchMap((invite) =>
          forkJoin({
            sessions: this.groupOrdersService.getSessions$(invite.GroupReservationId),
            ownerSessionId: this.groupOrdersService.getOwnerSessionId$(this.reservationId),
            status: this.groupOrdersService.getStatus$(invite.GroupReservationId),
          }).pipe(map((data) => ({ invite, ...data }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ invite, sessions, ownerSessionId, status }) => {
          this.invite.set(invite);
          this.participants.set(sessions.participants);
          this.ownerSessionId.set(ownerSessionId);
          this.groupStatus.set(status);
          this.updatedAt.set(new Date());
          this.syncFailed.set(false);
          this.loading.set(false);
          if (status.status === 'Open') this.startSync();
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(error.status === 404 ? 'notFound' : 'failed');
          this.loading.set(false);
        },
      });
  }

  /** Background sync (also the Refresh button): silent, never overlaps with a request still in flight. */
  refresh(): void {
    const groupId = this.groupId();
    if (!groupId || this.refreshing() || !this.isOpen()) return;

    this.refreshing.set(true);
    forkJoin({
      sessions: this.groupOrdersService.getSessions$(groupId, { silent: true }),
      status: this.groupOrdersService.getStatus$(groupId, { silent: true }),
    })
      .pipe(
        finalize(() => this.refreshing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ sessions, status }) => {
          this.participants.set(sessions.participants);
          this.groupStatus.set(status);
          this.updatedAt.set(new Date());
          this.syncFailed.set(false);
          if (status.status !== 'Open') this.stopSync();
        },
        // Keep the last data on screen; the interceptor toast is skipped for silent requests.
        error: () => this.syncFailed.set(true),
      });
  }

  openSubmitConfirm(): void {
    if (this.canSubmit()) this.confirmSubmitOpen.set(true);
  }

  closeSubmitConfirm(): void {
    if (!this.submitting()) this.confirmSubmitOpen.set(false);
  }

  confirmSubmit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.groupOrdersService
      .submit$(this.groupId(), this.reservationId)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.stopSync();
          this.groupStatus.update((status) => (status ? { ...status, status: 'Submitted' } : status));
          this.confirmSubmitOpen.set(false);
          this.toastService.success('Pre-order sent to the restaurant');
        },
        // The error toast comes from tokenInterceptor; just let the Owner try again.
        error: () => this.confirmSubmitOpen.set(false),
      });
  }

  askRemove(participant: Participant): void {
    if (this.canRemoveGuests()) this.removeTarget.set(participant);
  }

  cancelRemove(): void {
    if (!this.removing()) this.removeTarget.set(null);
  }

  confirmRemove(): void {
    const target = this.removeTarget();
    if (!target || this.removing()) return;

    this.removing.set(true);
    this.groupOrdersService
      .removeSession$(this.groupId(), target.id)
      .pipe(
        finalize(() => this.removing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (snapshot) => {
          this.participants.set(snapshot.participants);
          this.groupStatus.update((status) =>
            status ? { ...status, currentParticipants: Math.max(1, status.currentParticipants - 1) } : status,
          );
          this.removeTarget.set(null);
          this.toastService.success(`${target.name} was removed from the reservation`);
        },
        error: () => this.removeTarget.set(null),
      });
  }

  private startSync(): void {
    this.stopSync();
    this.syncSubscription = interval(SYNC_INTERVAL_MS).subscribe(() => this.refresh());
  }

  private stopSync(): void {
    this.syncSubscription?.unsubscribe();
    this.syncSubscription = undefined;
  }
}

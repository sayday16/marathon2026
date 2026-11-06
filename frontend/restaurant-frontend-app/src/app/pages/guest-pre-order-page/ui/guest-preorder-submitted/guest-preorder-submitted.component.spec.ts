import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GuestPreorderSubmittedComponent } from './guest-preorder-submitted.component';

describe('GuestPreorderSubmittedComponent', () => {
  let fixture: ComponentFixture<GuestPreorderSubmittedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestPreorderSubmittedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestPreorderSubmittedComponent);
  });

  it("says the dishes are added to the table of the person who invited the guest", () => {
    fixture.componentRef.setInput('invite', { InviterName: 'Alex Doe' } as GuestInvite);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("added to Alex Doe's table");
  });

  it('falls back to the host when the inviter is unknown', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("added to the host's table");
  });
});

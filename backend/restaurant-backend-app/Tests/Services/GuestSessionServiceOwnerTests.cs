using APIHandler.Constants.Dishes;
using APIHandler.Entities;
using APIHandler.Exceptions;
using APIHandler.Models.GuestSessions;
using APIHandler.Repositories.Auth;
using APIHandler.Repositories.Dishes;
using APIHandler.Repositories.GroupReservations;
using APIHandler.Repositories.GuestSessions;
using APIHandler.Repositories.Reservations;
using APIHandler.Repositories.Tables;
using APIHandler.Services.GuestSessions;
using AutoFixture;
using Moq;

namespace APIHandler.Tests.Services;

public class GuestSessionServiceOwnerTests
{
    private const string OwnerId = "owner-user-id";
    private const string GroupId = "group-1";
    private const string ReservationId = "reservation-1";

    private readonly Mock<IGuestSessionRepository> _guestSessionRepository = new();
    private readonly Mock<IGroupReservationRepository> _groupReservationRepository = new();
    private readonly Mock<IDishRepository> _dishRepository = new();
    private readonly Mock<IReservationRepository> _reservationRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ITableRepository> _tableRepository = new();
    private readonly GuestSessionService _service;
    private readonly Fixture _fixture = new();

    public GuestSessionServiceOwnerTests()
    {
        _service = new GuestSessionService(
            _groupReservationRepository.Object,
            _guestSessionRepository.Object,
            _dishRepository.Object,
            _reservationRepository.Object,
            _userRepository.Object,
            _tableRepository.Object);
    }

    private GroupReservation ArrangeOwnedGroup(string customerId = OwnerId)
    {
        var group = _fixture.Build<GroupReservation>()
            .With(g => g.GroupReservationId, GroupId)
            .With(g => g.ReservationId, ReservationId)
            .With(g => g.Status, GroupReservationStatus.Open)
            .Create();

        var reservation = _fixture.Build<Reservation>()
            .With(r => r.Id, ReservationId)
            .With(r => r.CustomerId, customerId)
            .Create();

        _groupReservationRepository.Setup(r => r.GetGroupReservationByIdAsync(GroupId)).ReturnsAsync(group);
        _groupReservationRepository.Setup(r => r.GetByReservationIdAsync(ReservationId)).ReturnsAsync(group);
        _reservationRepository.Setup(r => r.GetReservationByIdAsync(ReservationId)).ReturnsAsync(reservation);

        return group;
    }

    private Dish ArrangeDish(string id, decimal price)
    {
        var dish = _fixture.Build<Dish>().With(d => d.Id, id).With(d => d.Price, price).With(d => d.State, DishState.Available).Create();
        return dish;
    }

    private static GuestSession CreateSession(string id, string name, bool isSubmitted, bool isOwner = false, params (string DishId, int Quantity)[] dishes)
        => new()
        {
            Id = id,
            GuestName = name,
            GroupReservationId = GroupId,
            IsSubmitted = isSubmitted,
            IsOwnerSession = isOwner,
            OwnerUserId = isOwner ? OwnerId : null,
            Dishes = dishes.Select(d => new OrderItem { DishId = d.DishId, Quantity = d.Quantity }).ToList(),
        };

    [Fact]
    public async Task GetGroupSessionsAsync_ReturnsParticipantsWithTotals()
    {
        ArrangeOwnedGroup();
        var caesar = ArrangeDish("dish1", 180);
        var tomYum = ArrangeDish("dish2", 220);

        _guestSessionRepository
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([
                CreateSession("session1", "Andrii", true, false, ("dish1", 2)),
                CreateSession("session2", "Olena", false, false, ("dish2", 1)),
            ]);
        _dishRepository
            .Setup(r => r.GetDishesByIdsAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync([caesar, tomYum]);

        var result = await _service.GetGroupSessionsAsync(OwnerId, GroupId);

        var participants = result.Participants.ToList();
        Assert.Equal(2, participants.Count);
        Assert.Equal("session1", participants[0].Id);
        Assert.Equal(ParticipantType.Guest, participants[0].Type);
        Assert.Equal("Andrii", participants[0].Name);
        Assert.Equal(360, participants[0].Total);
        Assert.True(participants[0].IsSubmitted);
        Assert.Equal(2, participants[0].Items.Single().Quantity);
        Assert.Equal(220, participants[1].Total);
        Assert.False(participants[1].IsSubmitted);
        Assert.Equal(580, result.Total);
    }

    [Fact]
    public async Task GetGroupSessionsAsync_OwnerSession_IsListedFirstWithOwnerType()
    {
        ArrangeOwnedGroup();
        _guestSessionRepository
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([
                CreateSession("guest", "Guest", false),
                CreateSession("owner", "Owner", false, true),
            ]);
        _dishRepository.Setup(r => r.GetDishesByIdsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync([]);
        _userRepository.Setup(r => r.GetUserByIdAsync(OwnerId)).ReturnsAsync((Amazon.CognitoIdentityProvider.Model.UserType?)null);

        var result = await _service.GetGroupSessionsAsync(OwnerId, GroupId);

        var participants = result.Participants.ToList();
        Assert.Equal("owner", participants[0].Id);
        Assert.Equal(ParticipantType.Owner, participants[0].Type);
        Assert.Equal(ParticipantType.Guest, participants[1].Type);
        Assert.Equal(0, result.Total);
    }

    [Fact]
    public async Task GetGroupSessionsAsync_NoSessions_ReturnsEmptyList()
    {
        ArrangeOwnedGroup();
        _guestSessionRepository.Setup(r => r.GetAllByGroupReservationIdAsync(GroupId)).ReturnsAsync([]);
        _dishRepository.Setup(r => r.GetDishesByIdsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync([]);

        var result = await _service.GetGroupSessionsAsync(OwnerId, GroupId);

        Assert.Empty(result.Participants);
        Assert.Equal(0, result.Total);
    }

    [Fact]
    public async Task GetGroupSessionsAsync_NotOwner_ThrowsActionForbiddenException()
    {
        ArrangeOwnedGroup(customerId: "someone-else");

        await Assert.ThrowsAsync<ActionForbiddenException>(() => _service.GetGroupSessionsAsync(OwnerId, GroupId));
    }

    [Fact]
    public async Task GetGroupSessionsAsync_GroupNotFound_ThrowsGroupReservationNotFoundException()
    {
        _groupReservationRepository.Setup(r => r.GetGroupReservationByIdAsync(GroupId)).ReturnsAsync((GroupReservation?)null);

        await Assert.ThrowsAsync<GroupReservationNotFoundException>(() => _service.GetGroupSessionsAsync(OwnerId, GroupId));
    }

    [Fact]
    public async Task GetGroupSessionsAsync_ReservationNotFound_ThrowsReservationNotFoundException()
    {
        ArrangeOwnedGroup();
        _reservationRepository.Setup(r => r.GetReservationByIdAsync(ReservationId)).ReturnsAsync((Reservation?)null);

        await Assert.ThrowsAsync<ReservationNotFoundException>(() => _service.GetGroupSessionsAsync(OwnerId, GroupId));
    }

    [Fact]
    public async Task DeleteGuestSessionAsync_DeletesSessionAndReturnsUpdatedSnapshot()
    {
        ArrangeOwnedGroup();
        var tomYum = ArrangeDish("dish2", 220);
        var removed = CreateSession("session1", "Andrii", true, false, ("dish1", 2));
        var remaining = CreateSession("session2", "Olena", false, false, ("dish2", 1));

        _guestSessionRepository.Setup(r => r.GetByGuestSessionId("session1")).ReturnsAsync(removed);
        _guestSessionRepository.Setup(r => r.GetAllByGroupReservationIdAsync(GroupId)).ReturnsAsync([remaining]);
        _dishRepository.Setup(r => r.GetDishesByIdsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync([tomYum]);

        var result = await _service.DeleteGuestSessionAsync(OwnerId, GroupId, "session1");

        _guestSessionRepository.Verify(r => r.DeleteAsync(removed), Times.Once);
        var participant = Assert.Single(result.Participants);
        Assert.Equal("session2", participant.Id);
        Assert.Equal(220, participant.Total);
        Assert.Equal(220, result.Total);
    }

    [Fact]
    public async Task DeleteGuestSessionAsync_SessionFromAnotherGroup_ThrowsValidationExceptionAndDeletesNothing()
    {
        ArrangeOwnedGroup();
        var foreign = CreateSession("session1", "Andrii", false);
        foreign.GroupReservationId = "another-group";
        _guestSessionRepository.Setup(r => r.GetByGuestSessionId("session1")).ReturnsAsync(foreign);

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteGuestSessionAsync(OwnerId, GroupId, "session1"));

        _guestSessionRepository.Verify(r => r.DeleteAsync(It.IsAny<GuestSession>()), Times.Never);
    }

    [Fact]
    public async Task DeleteGuestSessionAsync_SessionNotFound_ThrowsGuestSessionNotFoundException()
    {
        ArrangeOwnedGroup();
        _guestSessionRepository.Setup(r => r.GetByGuestSessionId("missing")).ReturnsAsync((GuestSession?)null);

        await Assert.ThrowsAsync<GuestSessionNotFoundException>(() => _service.DeleteGuestSessionAsync(OwnerId, GroupId, "missing"));
    }

    [Fact]
    public async Task DeleteGuestSessionAsync_NotOwner_ThrowsActionForbiddenExceptionAndDeletesNothing()
    {
        ArrangeOwnedGroup(customerId: "someone-else");

        await Assert.ThrowsAsync<ActionForbiddenException>(() => _service.DeleteGuestSessionAsync(OwnerId, GroupId, "session1"));

        _guestSessionRepository.Verify(r => r.DeleteAsync(It.IsAny<GuestSession>()), Times.Never);
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_ExistingOwnerSession_ReturnsItsId()
    {
        ArrangeOwnedGroup();
        _guestSessionRepository
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([CreateSession("guest", "Guest", false), CreateSession("owner-session-123", "Owner", false, true)]);

        string id = await _service.GetOwnerGuestSessionIdAsync(OwnerId, ReservationId);

        Assert.Equal("owner-session-123", id);
        _guestSessionRepository.Verify(r => r.SaveAsync(It.IsAny<GuestSession>()), Times.Never);
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_NoOwnerSession_CreatesAndReturnsIt()
    {
        ArrangeOwnedGroup();
        _guestSessionRepository.Setup(r => r.GetAllByGroupReservationIdAsync(GroupId)).ReturnsAsync([CreateSession("guest", "Guest", false)]);

        GuestSession? saved = null;
        _guestSessionRepository
            .Setup(r => r.SaveAsync(It.IsAny<GuestSession>()))
            .Callback<GuestSession>(s => saved = s);

        string id = await _service.GetOwnerGuestSessionIdAsync(OwnerId, ReservationId);

        Assert.NotNull(saved);
        Assert.Equal(saved.Id, id);
        Assert.True(saved.IsOwnerSession);
        Assert.Equal(OwnerId, saved.OwnerUserId);
        Assert.Equal(GroupId, saved.GroupReservationId);
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_NotOwner_ThrowsActionForbiddenException()
    {
        ArrangeOwnedGroup(customerId: "someone-else");

        await Assert.ThrowsAsync<ActionForbiddenException>(() => _service.GetOwnerGuestSessionIdAsync(OwnerId, ReservationId));
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_ReservationNotFound_ThrowsReservationNotFoundException()
    {
        _reservationRepository.Setup(r => r.GetReservationByIdAsync(ReservationId)).ReturnsAsync((Reservation?)null);

        await Assert.ThrowsAsync<ReservationNotFoundException>(() => _service.GetOwnerGuestSessionIdAsync(OwnerId, ReservationId));
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_GroupNotFound_ThrowsGroupReservationNotFoundException()
    {
        ArrangeOwnedGroup();
        _groupReservationRepository.Setup(r => r.GetByReservationIdAsync(ReservationId)).ReturnsAsync((GroupReservation?)null);

        await Assert.ThrowsAsync<GroupReservationNotFoundException>(() => _service.GetOwnerGuestSessionIdAsync(OwnerId, ReservationId));
    }
}

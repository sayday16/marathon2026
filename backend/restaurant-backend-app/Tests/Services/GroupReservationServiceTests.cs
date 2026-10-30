using APIHandler.Constants;
using APIHandler.Entities;
using APIHandler.Exceptions;
using APIHandler.Models.GroupReservation;
using APIHandler.Repositories.GroupReservations;
using APIHandler.Repositories.GuestSessions;
using APIHandler.Repositories.Orders;
using APIHandler.Repositories.Reservations;
using APIHandler.Repositories.Tables;
using APIHandler.Services.Auth;
using APIHandler.Services.GroupReservations;
using APIHandler.Services.Locations;
using AutoFixture.Xunit2;
using Moq;

namespace APIHandler.Tests.Services;

public class GroupReservationServiceTests
{
    private readonly Mock<IGroupReservationRepository> _groupReservationRepositoryMock = new();
    private readonly Mock<ITableRepository> _tableRepositoryMock = new();
    private readonly Mock<IReservationRepository> _reservationRepositoryMock = new();
    private readonly Mock<IGuestSessionRepository> _guestSessionRepositoryMock = new();
    private readonly Mock<IUserService> _userServiceMock = new();
    private readonly Mock<ILocationService> _locationServiceMock = new();
    private readonly Mock<IOrderRepository> _orderRepositoryMock = new();

    private readonly GroupReservationService _service;

    public GroupReservationServiceTests()
    {
        _service = new GroupReservationService(
            _groupReservationRepositoryMock.Object,
            _tableRepositoryMock.Object,
            _reservationRepositoryMock.Object,
            _guestSessionRepositoryMock.Object,
            _userServiceMock.Object,
            _locationServiceMock.Object,
            _orderRepositoryMock.Object);
    }

    [Theory]
    [AutoData]
    public async Task GetGroupReservationByTokenAsync_ValidInput_ReturnsGroupReservationInfo(
        GroupReservation groupReservation,
        Table table,
        Reservation reservation,
        Location location,
        string expectedUserName)
    {
        groupReservation.ReservationId = reservation.Id;
        groupReservation.Status = GroupReservationStatus.Open;
        reservation.TableId = table.Id;
        table.LocationId = location.Id;

        _groupReservationRepositoryMock
            .Setup(r => r.GetGroupReservationByTokenAsync(groupReservation.ReservationToken))
            .ReturnsAsync(groupReservation);

        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _guestSessionRepositoryMock
            .Setup(r => r.CountByGroupReservationId(groupReservation.GroupReservationId))
            .ReturnsAsync(0);

        _tableRepositoryMock
            .Setup(r => r.GetTableAsync(table.Id))
            .ReturnsAsync(table);

        _locationServiceMock
            .Setup(s => s.GetLocationByIdAsync(table.LocationId))
            .ReturnsAsync(location);

        _userServiceMock
            .Setup(s => s.GetUserName(reservation.CustomerId!))
            .ReturnsAsync(expectedUserName);

        var result = await _service.GetGroupReservationByTokenAsync(groupReservation.ReservationToken);

        Assert.Equal(groupReservation.GroupReservationId, result.GroupReservationId);
        Assert.Equal(table.LocationId, result.LocationId);
        Assert.Equal(reservation.GuestCount, result.MaxGuestCount);
        Assert.Equal(reservation.StartTime, result.StartTime);
        Assert.Equal(reservation.EndTime, result.EndTime);
        Assert.Equal(table.TableNumber, result.TableNumber);
        Assert.Equal("Green & Tasty", result.RestaurantName);
        Assert.Equal(location.Address, result.LocationAddress);
        Assert.Equal(expectedUserName, result.InviterName);
    }

    [Theory]
    [AutoData]
    public async Task GetGroupReservationByTokenAsync_InvalidToken_ThrowsNotFound(string token)
    {
        _groupReservationRepositoryMock
            .Setup(r => r.GetGroupReservationByTokenAsync(token))
            .ReturnsAsync((GroupReservation?)null);

        await Assert.ThrowsAsync<GroupReservationNotFoundException>(() => _service.GetGroupReservationByTokenAsync(token));
    }

    [Theory]
    [InlineAutoData(GroupReservationStatus.Closed)]
    [InlineAutoData(GroupReservationStatus.Submitted)]
    public async Task GetGroupReservationByTokenAsync_GroupReservationIsNotOpen_ThrowsException(
        GroupReservationStatus status,
        GroupReservation groupReservation)
    {
        groupReservation.Status = status;

        _groupReservationRepositoryMock
            .Setup(r => r.GetGroupReservationByTokenAsync(groupReservation.ReservationToken))
            .ReturnsAsync(groupReservation);

        await Assert.ThrowsAsync<GroupReservationExpiredException>(() => _service.GetGroupReservationByTokenAsync(groupReservation.ReservationToken));
    }

    [Theory]
    [AutoData]
    public async Task GetGroupReservationByTokenAsync_WhenGuestCountIsMax_ThrowsGuestLimitExceeded(GroupReservation groupReservation, Reservation reservation)
    {
        groupReservation.Status = GroupReservationStatus.Open;
        groupReservation.ReservationId = reservation.Id;

        _groupReservationRepositoryMock
            .Setup(r => r.GetGroupReservationByTokenAsync(groupReservation.ReservationToken))
            .ReturnsAsync(groupReservation);

        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _guestSessionRepositoryMock
            .Setup(r => r.CountByGroupReservationId(groupReservation.GroupReservationId))
            .ReturnsAsync(reservation.GuestCount);

        await Assert.ThrowsAsync<GuestLimitExceededException>(() => _service.GetGroupReservationByTokenAsync(groupReservation.ReservationToken));
    }

    [Theory]
    [AutoData]
    public async Task CloseGroupReservationAsync_ValidInput_UpdatesGroupReservationStatus(GroupReservation groupReservation)
    {
        _groupReservationRepositoryMock
            .Setup(r => r.GetByReservationIdAsync(groupReservation.ReservationId))
            .ReturnsAsync(groupReservation);

        GroupReservation? savedGroupReservation = null;
        _groupReservationRepositoryMock
            .Setup(r => r.SaveGroupReservationAsync(It.IsAny<GroupReservation>()))
            .Callback<GroupReservation>(r => savedGroupReservation = r);

        await _service.CloseGroupReservationAsync(groupReservation.ReservationId);

        Assert.NotNull(savedGroupReservation);
        Assert.Equal(GroupReservationStatus.Closed, savedGroupReservation.Status);
    }

    [Theory]
    [AutoData]
    public async Task CloseGroupReservationAsync_GroupReservationNotFound_DoesNotThrowException(string reservationId)
    {
        _groupReservationRepositoryMock
            .Setup(r => r.GetByReservationIdAsync(reservationId))
            .ReturnsAsync((GroupReservation?)null);

        await _service.CloseGroupReservationAsync(reservationId);
    }

    [Theory]
    [AutoData]
    public async Task GetGroupReservationInviteTokenAsync_ValidInput_ReturnsToken(Reservation reservation, GroupReservation groupReservation)
    {
        reservation.Status = ReservationStatus.Reserved;
        reservation.GuestCount = 3;
        groupReservation.ReservationId = reservation.Id;
        groupReservation.Status = GroupReservationStatus.Open;

        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _groupReservationRepositoryMock
            .Setup(r => r.GetByReservationIdAsync(reservation.Id))
            .ReturnsAsync(groupReservation);

        GetGroupInviteTokenResponse result = await _service.GetGroupReservationInviteTokenAsync(reservation.Id);

        Assert.Equal(groupReservation.ReservationToken, result.Token);
    }

    [Theory]
    [AutoData]
    public async Task GetGroupReservationInviteTokenAsync_InvalidReservationId_ThrowsNotFound(string reservationId)
    {
        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservationId))
            .ReturnsAsync((Reservation?)null);

        await Assert.ThrowsAsync<ReservationNotFoundException>(() => _service.GetGroupReservationInviteTokenAsync(reservationId));
    }

    [Theory]
    [AutoData]
    public async Task GetGroupReservationInviteTokenAsync_OneGuest_ThrowsValidationException(Reservation reservation)
    {
        reservation.Status = ReservationStatus.Reserved;
        reservation.GuestCount = 1;

        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        await Assert.ThrowsAsync<ValidationException>(() => _service.GetGroupReservationInviteTokenAsync(reservation.Id));
    }

    [Theory]
    [InlineAutoData(ReservationStatus.Completed)]
    [InlineAutoData(ReservationStatus.Cancelled)]
    [InlineAutoData(ReservationStatus.InProgress)]
    public async Task GetGroupReservationInviteTokenAsync_StatusIsNotReserved_ThrowsValidationException(ReservationStatus reservationStatus, Reservation reservation)
    {
        reservation.Status = reservationStatus;
        reservation.GuestCount = 1;

        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        await Assert.ThrowsAsync<ValidationException>(() => _service.GetGroupReservationInviteTokenAsync(reservation.Id));
    }

    [Theory]
    [InlineAutoData(GroupReservationStatus.Closed, typeof(GroupReservationExpiredException))]
    [InlineAutoData(GroupReservationStatus.Submitted, typeof(GroupReservationSubmittedException))]
    public async Task GetGroupReservationInviteTokenAsync_GroupStatusIsNotOpen_ThrowsException(GroupReservationStatus status, Type type, Reservation reservation, GroupReservation groupReservation)
    {
        reservation.Status = ReservationStatus.Reserved;
        reservation.GuestCount = 3;
        groupReservation.ReservationId = reservation.Id;
        groupReservation.Status = status;

        _reservationRepositoryMock
            .Setup(r => r.GetReservationByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _groupReservationRepositoryMock
            .Setup(r => r.GetByReservationIdAsync(reservation.Id))
            .ReturnsAsync(groupReservation);

        await Assert.ThrowsAsync(type, () => _service.GetGroupReservationInviteTokenAsync(reservation.Id));
    }

    private const string OwnerId = "owner-user-id";
    private const string GroupId = "group-1";
    private const string ReservationId = "reservation-1";

    private GroupReservation ArrangeSubmittableGroup(
        Order order,
        string customerId = OwnerId,
        GroupReservationStatus status = GroupReservationStatus.Open)
    {
        var groupReservation = new GroupReservation
        {
            GroupReservationId = GroupId,
            ReservationId = ReservationId,
            ReservationToken = "token",
            Status = status,
        };
        var reservation = new Reservation
        {
            Id = ReservationId,
            TableId = "table-1",
            WaiterId = "waiter-1",
            CustomerId = customerId,
        };

        _groupReservationRepositoryMock.Setup(r => r.GetGroupReservationByIdAsync(GroupId)).ReturnsAsync(groupReservation);
        _reservationRepositoryMock.Setup(r => r.GetReservationByIdAsync(ReservationId)).ReturnsAsync(reservation);
        _orderRepositoryMock.Setup(r => r.GetOrderByReservationIdAsync(ReservationId)).ReturnsAsync(order);

        return groupReservation;
    }

    private static Order CreateOrder(params (string DishId, int Quantity)[] dishes) => new()
    {
        OrderId = "order-1",
        CustomerId = OwnerId,
        ReservationId = ReservationId,
        ReservationAddress = "address",
        ReservationTime = "time",
        Status = OrderStatus.Created,
        Dishes = dishes.Select(d => new OrderItem { DishId = d.DishId, Quantity = d.Quantity }).ToList(),
    };

    private static GuestSession CreateSession(bool isSubmitted, params (string DishId, int Quantity)[] dishes) => new()
    {
        Id = Guid.NewGuid().ToString(),
        GuestName = "Guest",
        GroupReservationId = GroupId,
        IsSubmitted = isSubmitted,
        Dishes = dishes.Select(d => new OrderItem { DishId = d.DishId, Quantity = d.Quantity }).ToList(),
    };

    [Fact]
    public async Task SubmitGroupPreOrderAsync_MergesOnlySubmittedSessionsAndUpdatesStatuses()
    {
        var order = CreateOrder();
        var group = ArrangeSubmittableGroup(order);
        _guestSessionRepositoryMock
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([
                CreateSession(true, ("dish1", 2), ("dish2", 1)),
                CreateSession(true, ("dish1", 1), ("dish2", 1)),
                CreateSession(false, ("dish3", 5)),
            ]);

        var result = await _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId);

        Assert.Equal(2, result.Count);
        Assert.Equal(new GroupPreOrderItemResponse("dish1", 3), result[0]);
        Assert.Equal(new GroupPreOrderItemResponse("dish2", 2), result[1]);
        Assert.Equal(OrderStatus.SubmittedByCustomer, order.Status);
        Assert.Equal(2, order.Dishes.Count);
        Assert.DoesNotContain(order.Dishes, d => d.DishId == "dish3");
        Assert.Equal(GroupReservationStatus.Submitted, group.Status);
        _orderRepositoryMock.Verify(r => r.SaveOrderAsync(order), Times.Once);
        _groupReservationRepositoryMock.Verify(r => r.SaveGroupReservationAsync(group), Times.Once);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_DishAlreadyInOrder_IncreasesQuantity()
    {
        var order = CreateOrder(("dish1", 4));
        ArrangeSubmittableGroup(order);
        _guestSessionRepositoryMock
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([CreateSession(true, ("dish1", 2))]);

        await _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId);

        Assert.Equal(6, Assert.Single(order.Dishes).Quantity);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_NoSubmittedSessions_ThrowsValidationExceptionAndChangesNothing()
    {
        var order = CreateOrder();
        var group = ArrangeSubmittableGroup(order);
        _guestSessionRepositoryMock
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([CreateSession(false, ("dish1", 2))]);

        await Assert.ThrowsAsync<ValidationException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));

        Assert.Equal(GroupReservationStatus.Open, group.Status);
        _orderRepositoryMock.Verify(r => r.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_SubmittedSessionsWithoutDishes_ThrowsValidationException()
    {
        ArrangeSubmittableGroup(CreateOrder());
        _guestSessionRepositoryMock
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([CreateSession(true)]);

        await Assert.ThrowsAsync<ValidationException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));

        _orderRepositoryMock.Verify(r => r.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_OrderNotFound_ThrowsValidationException()
    {
        ArrangeSubmittableGroup(CreateOrder());
        _orderRepositoryMock.Setup(r => r.GetOrderByReservationIdAsync(ReservationId)).ReturnsAsync((Order?)null);
        _guestSessionRepositoryMock
            .Setup(r => r.GetAllByGroupReservationIdAsync(GroupId))
            .ReturnsAsync([CreateSession(true, ("dish1", 2))]);

        await Assert.ThrowsAsync<ValidationException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));

        _groupReservationRepositoryMock.Verify(r => r.SaveGroupReservationAsync(It.IsAny<GroupReservation>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_GroupNotFound_ThrowsGroupReservationNotFoundException()
    {
        _groupReservationRepositoryMock.Setup(r => r.GetGroupReservationByIdAsync(GroupId)).ReturnsAsync((GroupReservation?)null);

        await Assert.ThrowsAsync<GroupReservationNotFoundException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_ReservationNotFound_ThrowsReservationNotFoundException()
    {
        ArrangeSubmittableGroup(CreateOrder());
        _reservationRepositoryMock.Setup(r => r.GetReservationByIdAsync(ReservationId)).ReturnsAsync((Reservation?)null);

        await Assert.ThrowsAsync<ReservationNotFoundException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_NotOwner_ThrowsActionForbiddenException()
    {
        ArrangeSubmittableGroup(CreateOrder(), customerId: "someone-else");

        await Assert.ThrowsAsync<ActionForbiddenException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_ReservationOfAnotherGroup_ThrowsValidationException()
    {
        var group = ArrangeSubmittableGroup(CreateOrder());
        group.ReservationId = "another-reservation";

        await Assert.ThrowsAsync<ValidationException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_AlreadySubmitted_ThrowsGroupReservationSubmittedException()
    {
        ArrangeSubmittableGroup(CreateOrder(), status: GroupReservationStatus.Submitted);

        await Assert.ThrowsAsync<GroupReservationSubmittedException>(() => _service.SubmitGroupPreOrderAsync(OwnerId, GroupId, ReservationId));

        _orderRepositoryMock.Verify(r => r.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
    }
}

using APIHandler.Entities;
using APIHandler.Mappers;
using APIHandler.Models.Reservations;
using APIHandler.Records;

namespace APIHandler.Tests.Mappers;

public class ReservationMapperTests
{
    private static CreateReservationRequest Request() => new()
    {
        TableId = "table-1",
        StartTime = new DateTime(2026, 11, 3, 16, 45, 0, DateTimeKind.Utc),
        EndTime = new DateTime(2026, 11, 3, 18, 15, 0, DateTimeKind.Utc),
        GuestCount = 4
    };

    [Fact]
    public void A_new_reservation_remembers_when_it_was_made()
    {
        DateTime before = DateTime.UtcNow;

        Reservation reservation = Request().ToReservation(new ReservationContext("customer-1", "waiter-1", false));

        Assert.NotNull(reservation.CreatedAt);
        Assert.InRange(reservation.CreatedAt!.Value, before, DateTime.UtcNow);
    }

    [Fact]
    public void The_response_carries_the_creation_time()
    {
        var createdAt = new DateTime(2026, 11, 1, 11, 20, 0, DateTimeKind.Utc);
        Reservation reservation = Request().ToReservation(new ReservationContext("customer-1", "waiter-1", false));
        reservation.CreatedAt = createdAt;

        ReservationResponse response = ReservationMapper.ToReservationResponse(reservation, "48 Rustaveli Avenue");

        Assert.Equal(createdAt, response.CreatedAt);
    }

    [Fact]
    public void A_reservation_made_before_the_field_existed_has_no_creation_time()
    {
        Reservation reservation = Request().ToReservation(new ReservationContext("customer-1", "waiter-1", false));
        reservation.CreatedAt = null;

        ReservationResponse response = ReservationMapper.ToReservationResponse(reservation, "48 Rustaveli Avenue");

        Assert.Null(response.CreatedAt);
    }
}

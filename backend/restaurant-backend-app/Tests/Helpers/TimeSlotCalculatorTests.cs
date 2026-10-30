using APIHandler.Constants;
using APIHandler.Entities;
using APIHandler.Helpers;

namespace APIHandler.Tests.Helpers;

public class TimeSlotCalculatorTests
{
    private static readonly DateTime Day = new(2026, 10, 31);

    private static DateTime At(int hour, int minute = 0) => Day.AddHours(hour).AddMinutes(minute);

    private static Reservation Booking(DateTime start, DateTime end, ReservationStatus status) => new()
    {
        Id = Guid.NewGuid().ToString(),
        TableId = "table-1",
        WaiterId = "waiter-1",
        StartTime = start,
        EndTime = end,
        Status = status,
    };

    private static List<DateTime> StartsOf(DateTime startTime, params Reservation[] reservations)
        => TimeSlotCalculator.Calculate(startTime, reservations).Select(slot => slot.Start).ToList();

    [Fact]
    public void Calculate_FreeTable_ChainsSlotsFromTheNextBoundaryOfTheGrid()
    {
        // 15:00 is not on the 90-minute grid counted from 10:00, so the first slot is 16:00.
        var starts = StartsOf(At(15));

        Assert.Equal([At(16), At(17, 45), At(19, 30)], starts);
    }

    [Fact]
    public void Calculate_StartTimeOnTheGrid_StartsExactlyAtThatTime()
    {
        Assert.Equal(At(13), StartsOf(At(13)).First());
    }

    [Fact]
    public void Calculate_SlotsEndWithinTheWorkingDay()
    {
        var slots = TimeSlotCalculator.Calculate(At(10), []);

        Assert.All(slots, slot => Assert.True(slot.End <= At(22)));
        Assert.All(slots, slot => Assert.Equal(TimeSlotCalculator.ReservationDuration, slot.End - slot.Start));
    }

    [Theory]
    [InlineData(ReservationStatus.Reserved)]
    [InlineData(ReservationStatus.InProgress)]
    public void Calculate_ActiveReservation_BlocksItsSlotAndMovesTheChain(ReservationStatus status)
    {
        var booking = Booking(At(16), At(17, 30), status);

        var starts = StartsOf(At(15), booking);

        Assert.DoesNotContain(At(16), starts);
        Assert.Equal(At(17, 45), starts.First());
    }

    [Fact]
    public void Calculate_CancelledReservation_DoesNotBlockItsSlot()
    {
        var cancelled = Booking(At(16), At(17, 30), ReservationStatus.Cancelled);

        var starts = StartsOf(At(15), cancelled);

        Assert.Equal([At(16), At(17, 45), At(19, 30)], starts);
    }

    [Fact]
    public void Calculate_OnlyTheActiveOneOfTwoReservationsBlocks()
    {
        var cancelled = Booking(At(10), At(11, 30), ReservationStatus.Cancelled);
        var active = Booking(At(13), At(14, 30), ReservationStatus.Reserved);

        var starts = StartsOf(At(10), cancelled, active);

        Assert.Contains(At(10), starts);
        Assert.DoesNotContain(At(13), starts);
    }
}

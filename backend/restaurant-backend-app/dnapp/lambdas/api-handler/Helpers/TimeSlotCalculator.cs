using APIHandler.Constants;
using APIHandler.Entities;
using APIHandler.Models.TimeSlots;
using System;
using System.Collections.Generic;
using System.Linq;

namespace APIHandler.Helpers;

public static class TimeSlotCalculator
{
    public static readonly TimeSpan ReservationDuration = TimeSpan.FromMinutes(90);
    public static readonly TimeSpan GapDuration = TimeSpan.FromMinutes(15);

    private const int WorkingDayStartHour = 10;
    private const int WorkingDayEndHour = 22;

    /// <summary>
    /// Builds the chain of free 90-minute slots of the day of <paramref name="startTime"/>, beginning at the next
    /// 90-minute boundary (counted from the opening hour) at or after <paramref name="startTime"/>.
    /// Cancelled reservations do not block a slot.
    /// </summary>
    public static List<TimeSlotResponse> Calculate(DateTime startTime, IEnumerable<Reservation> reservations)
    {
        var blockingReservations = reservations
            .Where(reservation => reservation.Status != ReservationStatus.Cancelled)
            .ToList();

        var workingDayStart = new DateTime(startTime.Year, startTime.Month, startTime.Day, WorkingDayStartHour, 0, 0, DateTimeKind.Unspecified);
        var workingDayEnd = new DateTime(startTime.Year, startTime.Month, startTime.Day, WorkingDayEndHour, 0, 0, DateTimeKind.Unspecified);

        var slots = new List<TimeSlotResponse>();
        var marginTo90Minutes =
            ReservationDuration.TotalMinutes - ((startTime - workingDayStart).TotalMinutes % ReservationDuration.TotalMinutes);
        DateTime current = marginTo90Minutes < ReservationDuration.TotalMinutes
            ? startTime.AddMinutes(marginTo90Minutes)
            : startTime;

        while (current + ReservationDuration <= workingDayEnd)
        {
            var potentialStart = current;
            var potentialEnd = potentialStart + ReservationDuration;

            var overlappingReservation = blockingReservations
                .FirstOrDefault(reservation => IsOverlapping(potentialStart, potentialEnd, reservation.StartTime, reservation.EndTime));

            if (overlappingReservation == null)
            {
                slots.Add(new TimeSlotResponse
                {
                    Start = potentialStart,
                    End = potentialEnd
                });

                current = potentialEnd + GapDuration;
            }
            else
            {
                // end time of reservation + gap
                current = overlappingReservation.EndTime.Add(GapDuration);
            }
        }

        return slots;
    }

    private static bool IsOverlapping(DateTime slotStart, DateTime slotEnd, DateTime reservationStart, DateTime reservationEnd)
    {
        return slotStart < reservationEnd && reservationStart < slotEnd;
    }
}

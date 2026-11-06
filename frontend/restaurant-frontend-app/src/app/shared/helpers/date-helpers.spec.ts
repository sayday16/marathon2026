import { addMinutesIso, findClosestDuration, localizeReservationTime, minutesBetween } from './date-helpers';

describe('date-helpers', () => {
  describe('addMinutesIso', () => {
    const cases: { name: string; input: string; minutes: number; expected: string }[] = [
      {
        name: 'adds minutes within the same hour',
        input: '2026-10-17T12:00:00.000Z',
        minutes: 30,
        expected: '2026-10-17T12:30:00.000Z',
      },
      {
        name: 'adds several hours',
        input: '2026-10-17T12:00:00.000Z',
        minutes: 180,
        expected: '2026-10-17T15:00:00.000Z',
      },
      {
        name: 'crosses midnight into the next day',
        input: '2026-10-17T23:30:00.000Z',
        minutes: 90,
        expected: '2026-10-18T01:00:00.000Z',
      },
      {
        name: 'returns the same instant for zero minutes',
        input: '2026-10-17T12:00:00.000Z',
        minutes: 0,
        expected: '2026-10-17T12:00:00.000Z',
      },
      {
        name: 'accepts ISO strings without milliseconds',
        input: '2026-10-17T12:00:00Z',
        minutes: 120,
        expected: '2026-10-17T14:00:00.000Z',
      },
    ];

    cases.forEach(({ name, input, minutes, expected }) => {
      it(name, () => {
        expect(addMinutesIso(input, minutes)).toBe(expected);
      });
    });
  });

  describe('minutesBetween', () => {
    it('returns the length of a 90-minute slot', () => {
      expect(minutesBetween('2026-10-17T12:00:00Z', '2026-10-17T13:30:00Z')).toBe(90);
    });

    it('counts across midnight', () => {
      expect(minutesBetween('2026-10-17T23:00:00Z', '2026-10-18T01:00:00Z')).toBe(120);
    });

    it('returns zero for the same instant', () => {
      expect(minutesBetween('2026-10-17T12:00:00Z', '2026-10-17T12:00:00Z')).toBe(0);
    });
  });

  describe('findClosestDuration', () => {
    const durations = [90, 120, 150, 180];
    const cases: { name: string; minutes: number; expected: number }[] = [
      { name: 'returns the exact match', minutes: 120, expected: 120 },
      { name: 'rounds down to the nearest option', minutes: 130, expected: 120 },
      { name: 'rounds up to the nearest option', minutes: 145, expected: 150 },
      { name: 'picks the shorter option on a tie', minutes: 135, expected: 120 },
      { name: 'clamps below the shortest option', minutes: 30, expected: 90 },
      { name: 'clamps above the longest option', minutes: 600, expected: 180 },
      { name: 'handles zero minutes', minutes: 0, expected: 90 },
    ];

    cases.forEach(({ name, minutes, expected }) => {
      it(name, () => {
        expect(findClosestDuration(minutes, durations)).toBe(expected);
      });
    });

    it('returns the only option when there is one', () => {
      expect(findClosestDuration(500, [60])).toBe(60);
    });
  });

  describe('localizeReservationTime', () => {
    const localTime = (hours: number, minutes: number, utcDay = 2): string =>
      new Date(Date.UTC(2026, 10, utcDay, hours, minutes)).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

    it('shows the UTC text of the API in the local time', () => {
      const text = localizeReservationTime('Nov 02, 2026, 4:15 PM - 5:45 PM');

      expect(text).toContain(localTime(16, 15));
      expect(text).toContain(localTime(17, 45));
    });

    it('keeps the format of the API text (date, start - end)', () => {
      expect(localizeReservationTime('Nov 02, 2026, 4:15 PM - 5:45 PM')).toMatch(
        /^[A-Z][a-z]{2} \d{2}, 2026, \d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M$/,
      );
    });

    it('reads 12 AM and 12 PM correctly', () => {
      const text = localizeReservationTime('Nov 02, 2026, 12:00 PM - 1:30 PM');

      expect(text).toContain(localTime(12, 0));
      expect(text).toContain(localTime(13, 30));
    });

    it('moves the end to the next day when the stay passes midnight', () => {
      const text = localizeReservationTime('Nov 02, 2026, 11:30 PM - 1:00 AM');

      expect(text).toContain(localTime(23, 30));
      expect(text).toContain(localTime(1, 0, 3));
    });

    it('returns any other text unchanged', () => {
      expect(localizeReservationTime('2026-09-07T12:15:00Z')).toBe('2026-09-07T12:15:00Z');
      expect(localizeReservationTime('')).toBe('');
    });
  });
});

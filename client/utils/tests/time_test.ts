import moment from 'moment';
import sinon from 'sinon';
import {timeUtils} from '../';
import {restoreSinonStub} from '../testUtils';


describe('utils.time', () => {
    it('getStartOfNextWeek', () => {
        // StartOfWeek == Sunday
        expect([
            timeUtils.getStartOfNextWeek(moment('2018-03-24'), 0).format('YYYY-MM-DD'), // Saturday
            timeUtils.getStartOfNextWeek(moment('2018-03-25'), 0).format('YYYY-MM-DD'), // Sunday
            timeUtils.getStartOfNextWeek(moment('2018-03-26'), 0).format('YYYY-MM-DD'), // Monday
            timeUtils.getStartOfNextWeek(moment('2018-03-27'), 0).format('YYYY-MM-DD'), // Tuesday
            timeUtils.getStartOfNextWeek(moment('2018-03-28'), 0).format('YYYY-MM-DD'), // Wednesday
            timeUtils.getStartOfNextWeek(moment('2018-03-29'), 0).format('YYYY-MM-DD'), // Thursday
            timeUtils.getStartOfNextWeek(moment('2018-03-30'), 0).format('YYYY-MM-DD'), // Friday
            timeUtils.getStartOfNextWeek(moment('2018-03-31'), 0).format('YYYY-MM-DD'), // Saturday
        ]).toEqual([
            '2018-03-25',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
        ]);

        // StartOfWeek == Monday
        expect([
            timeUtils.getStartOfNextWeek(moment('2018-03-24'), 1).format('YYYY-MM-DD'), // Saturday
            timeUtils.getStartOfNextWeek(moment('2018-03-25'), 1).format('YYYY-MM-DD'), // Sunday
            timeUtils.getStartOfNextWeek(moment('2018-03-26'), 1).format('YYYY-MM-DD'), // Monday
            timeUtils.getStartOfNextWeek(moment('2018-03-27'), 1).format('YYYY-MM-DD'), // Tuesday
            timeUtils.getStartOfNextWeek(moment('2018-03-28'), 1).format('YYYY-MM-DD'), // Wednesday
            timeUtils.getStartOfNextWeek(moment('2018-03-29'), 1).format('YYYY-MM-DD'), // Thursday
            timeUtils.getStartOfNextWeek(moment('2018-03-30'), 1).format('YYYY-MM-DD'), // Friday
            timeUtils.getStartOfNextWeek(moment('2018-03-31'), 1).format('YYYY-MM-DD'), // Saturday
        ]).toEqual([
            '2018-03-26',
            '2018-03-26',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
        ]);

        // StartOfWeek == Saturday
        expect([
            timeUtils.getStartOfNextWeek(moment('2018-03-24'), 6).format('YYYY-MM-DD'), // Saturday
            timeUtils.getStartOfNextWeek(moment('2018-03-25'), 6).format('YYYY-MM-DD'), // Sunday
            timeUtils.getStartOfNextWeek(moment('2018-03-26'), 6).format('YYYY-MM-DD'), // Monday
            timeUtils.getStartOfNextWeek(moment('2018-03-27'), 6).format('YYYY-MM-DD'), // Tuesday
            timeUtils.getStartOfNextWeek(moment('2018-03-28'), 6).format('YYYY-MM-DD'), // Wednesday
            timeUtils.getStartOfNextWeek(moment('2018-03-29'), 6).format('YYYY-MM-DD'), // Thursday
            timeUtils.getStartOfNextWeek(moment('2018-03-30'), 6).format('YYYY-MM-DD'), // Friday
            timeUtils.getStartOfNextWeek(moment('2018-03-31'), 6).format('YYYY-MM-DD'), // Saturday
        ]).toEqual([
            '2018-03-31',
            '2018-03-31',
            '2018-03-31',
            '2018-03-31',
            '2018-03-31',
            '2018-03-31',
            '2018-03-31',
            '2018-04-07',
        ]);
    });

    it('getStartOfPreviousWeek', () => {
        // StartOfWeek == Sunday
        expect([
            timeUtils.getStartOfPreviousWeek(moment('2018-03-31'), 0).format('YYYY-MM-DD'), // Saturday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-01'), 0).format('YYYY-MM-DD'), // Sunday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-02'), 0).format('YYYY-MM-DD'), // Monday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-03'), 0).format('YYYY-MM-DD'), // Tuesday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-04'), 0).format('YYYY-MM-DD'), // Wednesday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-05'), 0).format('YYYY-MM-DD'), // Thursday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-06'), 0).format('YYYY-MM-DD'), // Friday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-07'), 0).format('YYYY-MM-DD'), // Saturday
        ]).toEqual([
            '2018-03-25',
            '2018-03-25',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
            '2018-04-01',
        ]);

        // StartOfWeek == Monday
        expect([
            timeUtils.getStartOfPreviousWeek(moment('2018-03-31'), 1).format('YYYY-MM-DD'), // Saturday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-01'), 1).format('YYYY-MM-DD'), // Sunday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-02'), 1).format('YYYY-MM-DD'), // Monday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-03'), 1).format('YYYY-MM-DD'), // Tuesday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-04'), 1).format('YYYY-MM-DD'), // Wednesday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-05'), 1).format('YYYY-MM-DD'), // Thursday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-06'), 1).format('YYYY-MM-DD'), // Friday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-07'), 1).format('YYYY-MM-DD'), // Saturday
        ]).toEqual([
            '2018-03-26',
            '2018-03-26',
            '2018-03-26',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
            '2018-04-02',
        ]);

        // StartOfWeek == Saturday
        expect([
            timeUtils.getStartOfPreviousWeek(moment('2018-04-07'), 6).format('YYYY-MM-DD'), // Saturday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-08'), 6).format('YYYY-MM-DD'), // Sunday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-09'), 6).format('YYYY-MM-DD'), // Monday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-10'), 6).format('YYYY-MM-DD'), // Tuesday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-11'), 6).format('YYYY-MM-DD'), // Wednesday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-12'), 6).format('YYYY-MM-DD'), // Thursday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-13'), 6).format('YYYY-MM-DD'), // Friday
            timeUtils.getStartOfPreviousWeek(moment('2018-04-14'), 6).format('YYYY-MM-DD'), // Saturday
        ]).toEqual([
            '2018-03-31',
            '2018-04-07',
            '2018-04-07',
            '2018-04-07',
            '2018-04-07',
            '2018-04-07',
            '2018-04-07',
            '2018-04-07',
        ]);
    });

    it('getStartOfNextMonth', () => {
        expect([
            timeUtils.getStartOfNextMonth(moment('2018-04-01')).format('YYYY-MM-DD'),
            timeUtils.getStartOfNextMonth(moment('2018-04-11')).format('YYYY-MM-DD'),
        ]).toEqual([
            '2018-05-01',
            '2018-05-01',
        ]);
    });

    it('getStartOfPreviousMonth', () => {
        expect([
            timeUtils.getStartOfPreviousMonth(moment('2018-04-01')).format('YYYY-MM-DD'),
            timeUtils.getStartOfPreviousMonth(moment('2018-04-11')).format('YYYY-MM-DD'),
        ]).toEqual([
            '2018-03-01',
            '2018-04-01',
        ]);
    });

    describe('Event Timezone', () => {
        it('Is Event in different timezone', () => {
            const event = {
                dates: {
                    start: moment('2018-04-01T01:00:00+00:00'),
                    end: moment('2018-04-01T20:00:00+00:00'),
                    tz: 'Europe/London',
                },
            };

            sinon.stub(timeUtils, 'localTimeZone').callsFake(() => 'Australia/Sydney');
            expect(timeUtils.isEventInDifferentTimeZone(event)).toBeTruthy();
            restoreSinonStub(timeUtils.localTimeZone);
        });

        it('Is Event in same timezone', () => {
            const event = {
                dates: {
                    start: moment('2018-04-01T01:00:00+00:00'),
                    end: moment('2018-04-01T20:00:00+00:00'),
                    tz: 'Europe/Oslo',
                },
            };

            sinon.stub(timeUtils, 'localTimeZone').callsFake(() => 'Europe/Amsterdam');
            expect(timeUtils.isEventInDifferentTimeZone(event)).toBeFalsy();
            restoreSinonStub(timeUtils.localTimeZone);
        });
    });
});

import eventValidators from '../events';
import moment from 'moment';

describe('eventValidators', () => {
    const maxRecurrentEvents = 200;
    let event;

    beforeEach(() => {
        event = {
            dates: {
                start: moment('2014-10-15T14:01:11'),
                end: moment('2014-10-15T14:01:11'),
                recurring_rule: {
                    frequency: 'DAILY',
                    endRepeatMode: 'count',
                    count: 6,
                    interval: 1,
                }
            }
        };
    });

    it('validation pass if data is valid', () => {
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(false);
    });

    it('fail when end date is before start', () => {
        event.dates.end = moment('2013-10-15T14:01:11');
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(true);
        expect(result.data).toEqual({
            dates: {
                end: 'End date should be after start date',
                recurring_rule: {},
            }
        });
    });

    it('fail if byday is empty for WEEKLY frequency', () => {
        event.dates.recurring_rule.frequency = 'WEEKLY';
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(true);
        expect(result.data).toEqual({
            dates: {
                recurring_rule: {
                    byday: 'Required',
                },
            }
        });
    });

    it('fail if no until date when repeat mode is until', () => {
        event.dates.recurring_rule.endRepeatMode = 'until';
        event.dates.recurring_rule.count = null;
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(true);
        expect(result.data).toEqual({
            dates: {
                recurring_rule: {
                    until: 'Required',
                },
            }
        });
    });

    it('fail if until date is before start date', () => {
        event.dates.recurring_rule.endRepeatMode = 'until';
        event.dates.recurring_rule.count = null;
        event.dates.recurring_rule.until = moment('2013-10-15T14:01:11');
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(true);
        expect(result.data).toEqual({
            dates: {
                recurring_rule: {
                    until: 'Must be greater than starting date',
                },
            }
        });
    });

    it('fail if count is greater than', () => {
        event.dates.recurring_rule.count = 250;
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(true);
        expect(result.data).toEqual({
            dates: {
                recurring_rule: {
                    count: 'Must be less than 201',
                },
            }
        });
    });

    it('fail if count is not greater than 1', () => {
        event.dates.recurring_rule.count = 1;
        const result = eventValidators.validateEventDates(event.dates, maxRecurrentEvents);

        expect(result.hasErrors).toBe(true);
        expect(result.data).toEqual({
            dates: {
                recurring_rule: {
                    count: 'Must be greater than 1',
                },
            }
        });
    });
});

import eventValidators from '../events';
import moment from 'moment';
import {deployConfig} from '../../utils/testData';
import {cloneDeep} from 'lodash';

describe('eventValidators', () => {
    let event;
    let errors;
    let state;
    let getState = () => state;

    beforeEach(() => {
        event = {
            dates: {
                start: moment('2014-10-15T14:01:11'),
                end: moment('2014-10-15T16:01:11'),
                recurring_rule: {
                    frequency: 'DAILY',
                    endRepeatMode: 'count',
                    count: 6,
                    interval: 1,
                }
            }
        };
        errors = {};
        state = {deployConfig: cloneDeep(deployConfig)};
    });

    const testValidate = (func, field, response) => {
        func(null, getState, field, event[field], null, errors);
        expect(errors).toEqual(response);
    };

    it('passes valid dates', () =>
        testValidate(eventValidators.validateDates, 'dates', {})
    );

    describe('validateRequiredDates', () => {
        it('fails if start date is not defined', () => {
            event.dates.start = null;
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {
                    start: {
                        date: 'This field is required',
                        time: 'This field is required',
                    }
                }
            });
        });

        it('fails if end date is not defined', () => {
            event.dates.end = null;
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {
                    end: {
                        date: 'This field is required',
                        time: 'This field is required',
                    }
                }
            });
        });
    });

    describe('validateDateRange', () => {
        it('fail if end time should is after start time', () => {
            event.dates.end = moment('2014-10-15T11:01:11');
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {end: {time: 'End time should be after start time'}}
            });
        });

        it('fail if end date should is after start date', () => {
            event.dates.end = moment('2014-10-13T14:01:11');
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {end: {date: 'End date should be after start date'}}
            });
        });
    });

    describe('validateRecurringRules', () => {
        it('fail if byday is empty for WEEKLY frequency', () => {
            event.dates.recurring_rule.frequency = 'WEEKLY';
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {recurring_rule: {byday: 'Required'}}
            });
        });

        it('fail if no until date when repeat mode is until', () => {
            event.dates.recurring_rule.endRepeatMode = 'until';
            event.dates.recurring_rule.count = null;
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {recurring_rule: {until: 'Required'}}
            });
        });

        it('fail if until date is before start date', () => {
            event.dates.recurring_rule.endRepeatMode = 'until';
            event.dates.recurring_rule.count = null;
            event.dates.recurring_rule.until = moment('2013-10-15T14:01:11');
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {recurring_rule: {until: 'Must be greater than starting date'}}
            });
        });

        it('fail if count is greater than', () => {
            event.dates.recurring_rule.count = 250;
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {recurring_rule: {count: 'Must be less than 201'}}
            });
        });

        it('fail if count is not greater than 1', () => {
            event.dates.recurring_rule.count = 1;
            testValidate(eventValidators.validateDates, 'dates', {
                dates: {recurring_rule: {count: 'Must be greater than 1'}}
            });
        });
    });

    it('validateFilesAndLinks', () => {
        testValidate(eventValidators.validateFilesAndLinks, 'files', {});

        event.files = [];
        testValidate(eventValidators.validateFilesAndLinks, 'files', {});

        event.files = [{}];
        testValidate(eventValidators.validateFilesAndLinks, 'files', {
            files: {0: 'Required'}
        });
    });
});

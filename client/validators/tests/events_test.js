import {appConfig} from 'appConfig';

import eventValidators from '../events';
import moment from 'moment';
import {initialState} from '../../utils/testData';
import {cloneDeep} from 'lodash';

describe('eventValidators', () => {
    let event;
    let errors;
    let errorMessages;
    let state;
    let getState = () => state;

    beforeEach(() => {
        const startTime = moment('2094-10-15T14:01:11');
        const endTime = moment('2094-10-15T16:01:11');

        event = {
            dates: {
                start: startTime,
                end: endTime,
                recurring_rule: {
                    frequency: 'DAILY',
                    endRepeatMode: 'count',
                    count: 6,
                    interval: 1,
                },
                tz: 'Australia/Sydney',
            },
        };
        errors = {};
        errorMessages = [];
        state = cloneDeep(initialState);
    });

    const testValidate = (func, field, response, messages = []) => {
        let value = event[field];

        if (field === 'dates') {
            value._startTime = event.dates.start;
            value._endTime = event.dates.end;
        }

        func({
            getState: getState,
            field: field,
            value: value,
            errors: errors,
            messages: errorMessages,
        });
        expect(errors).toEqual(response);
        expect(errorMessages).toEqual(messages);
    };

    it('passes valid dates', () =>
        testValidate(eventValidators.validateDates, 'dates', {})
    );

    describe('validateRequiredDates', () => {
        it('fails if start date is not defined', () => {
            event.dates.start = null;
            testValidate(eventValidators.validateDates, 'dates',
                {
                    dates: {
                        start: {
                            date: 'This field is required',
                        },
                    },
                    _startTime: 'This field is required',
                },
                ['START DATE is a required field', 'START TIME is a required field']
            );
        });

        it('fails if end date is not defined', () => {
            event.dates.end = null;
            testValidate(eventValidators.validateDates, 'dates',
                {
                    dates: {
                        end: {
                            date: 'This field is required',
                        },
                    },
                    _endTime: 'This field is required',
                },
                ['END DATE is a required field', 'END TIME is a required field']
            );
        });

        it('fails if timezone is not defined', () => {
            event.dates.tz = null;
            testValidate(eventValidators.validateDates, 'dates',
                {
                    dates: {tz: 'This field is required'},
                },
                ['TIMEZONE is a required field']
            );
        });
    });

    describe('validateDateRange', () => {
        it('fail if end time should is after start time', () => {
            event.dates.end = moment('2094-10-15T11:01:11');
            testValidate(eventValidators.validateDates, 'dates',
                {_endTime: 'End time should be after start time'},
                ['END TIME should be after START TIME']
            );
        });

        it('fail if end date should is after start date', () => {
            event.dates.end = moment('2094-10-13T14:01:11');
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {end: {date: 'End date should be after start date'}}},
                ['END DATE should be after START DATE']
            );
        });
    });

    describe('validate max multi day duration', () => {
        afterEach(() => {
            appConfig.max_multi_day_event_duration = 0;
        });

        it('fail if multi day duration is greater than max duration', () => {
            appConfig.max_multi_day_event_duration = 7;
            event.dates.start = moment('2094-10-15T11:01:11');
            event.dates.end = moment('2094-10-22T12:01:11');
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {end: {date: 'Event duration is greater than 7 days.'}}},
                ['Event duration is greater than 7 days.']
            );
        });
    });

    describe('validateDateInPast', () => {
        it('start or end date in the past without `planning_create_past` privilege', () => {
            state.privileges.planning_create_past = 0;

            event.dates.start = moment('2000-10-15T11:01:11');
            testValidate(
                eventValidators.validateDateInPast,
                'dates',
                {start: {date: 'Start date is in the past'}},
                ['START DATE cannot be in the past']
            );

            errors = {};
            errorMessages = [];
            event.dates.start = moment('2094-10-15T11:01:11');
            event.dates.end = moment('2000-10-15T11:01:11');
            testValidate(
                eventValidators.validateDateInPast,
                'dates',
                {end: {date: 'End date is in the past'}},
                ['END DATE cannot be in the past']
            );
        });

        it('start or end date in the past with `planning_create_past` privilege', () => {
            event.dates.start = moment('2000-10-15T11:01:11');
            testValidate(
                eventValidators.validateDateInPast,
                'dates',
                {start: {date: 'Start date is in the past'}},
                []
            );

            errors = {};
            errorMessages = [];
            event.dates.start = moment('2094-10-15T11:01:11');
            event.dates.end = moment('2000-10-15T11:01:11');
            testValidate(
                eventValidators.validateDateInPast,
                'dates',
                {end: {date: 'End date is in the past'}},
                []
            );
        });

        it('both start and end date in the future', () => {
            testValidate(
                eventValidators.validateDateInPast,
                'dates',
                {},
                []
            );
        });
    });

    describe('validateRecurringRules', () => {
        it('fail if byday is empty for WEEKLY frequency', () => {
            event.dates.recurring_rule.frequency = 'WEEKLY';
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {recurring_rule: {byday: 'Required'}}},
                ['RECURRING REPEAT ON is a required field']
            );
        });

        it('fail if no until date when repeat mode is until', () => {
            event.dates.recurring_rule.endRepeatMode = 'until';
            event.dates.recurring_rule.count = null;
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {recurring_rule: {until: 'Required'}}},
                ['RECURRING REPEAT UNTIL is a required field']
            );
        });

        it('fail if until date is before start date', () => {
            event.dates.recurring_rule.endRepeatMode = 'until';
            event.dates.recurring_rule.count = null;
            event.dates.recurring_rule.until = moment('2013-10-15T14:01:11');
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {recurring_rule: {until: 'Must be greater than starting date'}}},
                ['RECURRING ENDS ON must be greater than START DATE']
            );
        });

        it('fail if count is greater than', () => {
            event.dates.recurring_rule.count = 250;
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {recurring_rule: {count: 'Must be less than 201'}}},
                ['RECURRING REPEAT COUNT must be less than 201']
            );
        });

        it('fail if count is not greater than 1', () => {
            event.dates.recurring_rule.count = 1;
            testValidate(eventValidators.validateDates, 'dates',
                {dates: {recurring_rule: {count: 'Must be greater than 1'}}},
                ['RECURRING REPEAT COUNT must be greater than 1']
            );
        });
    });

    it('validateFiles', () => {
        testValidate(eventValidators.validateFiles, 'files', {});

        event.files = [];
        testValidate(eventValidators.validateFiles, 'files', {});

        event.files = [{}];
        testValidate(eventValidators.validateFiles, 'files',
            {files: {0: 'Required'}},
            ['ATTACHED FILE 1 is required']
        );
    });

    it('validateLinks', () => {
        testValidate(eventValidators.validateLinks, 'links', {});

        event.links = [];
        testValidate(eventValidators.validateLinks, 'links', {});

        event.links = [''];
        testValidate(eventValidators.validateLinks, 'links', {});

        event.links = ['foobar'];
        testValidate(eventValidators.validateLinks, 'links', {});

        event.links = ['foobar.com'];
        testValidate(eventValidators.validateLinks, 'links',
            {links: {0: 'Must start with "http://", "https://" or "www."'}},
            ['EXTERNAL LINK 1 must start with "http://", "https://" or "www."']
        );

        errorMessages = [];
        event.links = ['www.foobar.com.'];
        testValidate(eventValidators.validateLinks, 'links',
            {links: {0: 'Cannot end with "."'}},
            ['EXTERNAL LINK 1 cannot end with "."']
        );

        errorMessages = [];
        event.links = ['www.foobar.com'];
        testValidate(eventValidators.validateLinks, 'links', {});

        errorMessages = [];
        event.links = ['http://www.foobar.com'];
        testValidate(eventValidators.validateLinks, 'links', {});

        errorMessages = [];
        event.links = ['https://www.foobar.com'];
        testValidate(eventValidators.validateLinks, 'links', {});
    });
});

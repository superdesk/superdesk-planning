import moment from 'moment';
import {initialState} from '../../utils/testData';
import {cloneDeep} from 'lodash';
import planningValidators from '../planning';

describe('planningValidators', () => {
    let planning;
    let errors;
    let errorMessages;
    let state;
    let getState = () => state;

    beforeEach(() => {
        const coverageId = 'coverage_id';
        const coverageSchedule = moment('2094-10-15T14:01:11');
        const scheduledUpdateSchedule = moment('2094-10-20T14:01:11');

        planning = {
            planning_date: coverageSchedule,
            coverages: [{
                coverageId: coverageId,
                planning: {
                    scheduled: coverageSchedule,
                    _scheduledTime: coverageSchedule,
                },
                scheduled_updates: [{
                    coverageId: coverageId,
                    planning: {
                        scheduled: scheduledUpdateSchedule,
                        _scheduledTime: scheduledUpdateSchedule,
                    },
                },
                {
                    coverageId: coverageId,
                    planning: {
                        scheduled: scheduledUpdateSchedule,
                        _scheduledTime: scheduledUpdateSchedule,
                    },
                }],
            }],
        };
        errors = {};
        errorMessages = [];
        state = cloneDeep(initialState);
    });

    it('fails if planning date is in past and without sufficient privileges', () => {
        state.privileges.planning_create_past = 0;
        const planningDiff = cloneDeep(planning);

        planningDiff.planning_date = moment('2014-10-15T14:01:11');
        planningValidators.validatePlanningScheduleDate({
            getState: getState,
            field: 'planning_date',
            value: planningDiff.planning_date,
            errors: errors,
            messages: errorMessages,
            diff: planningDiff,
            item: planning});
        expect(errorMessages).toEqual(['PLANNING DATE cannot be in the past']);
        expect(errors).toEqual({
            planning_date: {
                date: 'Planning date is in the past',
            },
        });
    });

    it('Coverage schedule cannot change to past without sufficient privileges', () => {
        state.privileges.planning_create_past = 0;
        const planningDiff = cloneDeep(planning);

        planningDiff.coverages[0].planning.scheduled = moment('2014-10-15T14:01:11');
        planningValidators.validateCoverageScheduleDate({
            getState: getState,
            field: 'coverages[0].planning.scheduled',
            value: planningDiff.coverages[0].planning.scheduled,
            errors: errors,
            messages: errorMessages});
        expect(errorMessages).toEqual(['COVERAGE SCHEDULED DATE cannot be in the past']);
        expect(errors).toEqual({
            coverages: [{
                planning: {
                    scheduled: {
                        date: 'Date is in the past',
                    },
                },
            }],
        });
    });

    it('Fails if scheduled updates are not ahead of each other in the sequential order', () => {
        const planningDiff = cloneDeep(planning);

        planningDiff.coverages[0].scheduled_updates[1].planning.scheduled = moment('2094-10-17T14:01:11');
        planningDiff.coverages[0].scheduled_updates[1].planning._scheduledTime = moment('2094-10-17T14:01:11');
        planningValidators.validateScheduledUpdatesDate({
            getState: getState,
            field: 'planningDiff.coverages[0].scheduled_updates',
            value: planningDiff.coverages[0].scheduled_updates,
            errors: errors,
            messages: errorMessages,
            diff: planningDiff,
        });
        expect(errorMessages).toEqual(['Scheduled Upates have to be after the previous updates.']);
        expect(errors).toEqual({
            scheduled_updates: {
                1: {
                    planning: {
                        scheduled: {
                            date: 'Should be after the previous scheduled update/coverage',
                        },
                        _scheduledTime: 'Should be after the previous scheduled update/coverage',
                    },
                },
            },
        });
    });

    it('Fails if scheduled updates are not ahead of coverage schedule', () => {
        const planningDiff = cloneDeep(planning);

        planningDiff.coverages[0].scheduled_updates[0].planning.scheduled = moment('2014-10-17T14:01:11');
        planningValidators.validateScheduledUpdatesDate({
            getState: getState,
            field: 'planningDiff.coverages[0].scheduled_updates',
            value: planningDiff.coverages[0].scheduled_updates,
            errors: errors,
            messages: errorMessages,
            diff: planningDiff,
        });
        expect(errorMessages).toEqual(['Scheduled Upates have to be after the previous updates.']);
        expect(errors).toEqual({
            scheduled_updates: {
                0: {
                    planning: {
                        scheduled: {
                            date: 'Should be after the previous scheduled update/coverage',
                        },
                        _scheduledTime: 'Should be after the previous scheduled update/coverage',
                    },
                },
            },
        });
    });
});

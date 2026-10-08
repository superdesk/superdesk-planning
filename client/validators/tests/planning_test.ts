import {IVocabulary} from 'superdesk-api';
import moment from 'moment';
import sinon from 'sinon';
import {initialState} from '../../utils/testData';
import {restoreSinonStub} from '../../utils/testUtils';
import {cloneDeep} from 'lodash';
import planningValidators, {
    validateCoverageCustomTextFields,
    validateCoverageVocabularyFields,
} from '../planning';
import {superdeskApi} from '../../superdeskApi';
import {vocabularies} from '../../api/vocabularies';
import {ICoverageContentProfile} from '../../interfaces';

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
            profile: {},
            messages: errorMessages
        });
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

    it('fails if coverage schedule is required but value is invalid', () => {
        const profile = {
            schema: {
                scheduled: {
                    required: true
                }
            }
        };

        planningValidators.validateCoverageScheduleDate({
            getState: getState,
            field: 'coverages[0].planning.scheduled',
            value: 'invalid_date',
            profile: profile,
            errors: errors,
            messages: errorMessages
        });
        expect(errorMessages).toEqual(['COVERAGE SCHEDULE is required']);
        expect(errors).toEqual({
            planning: {
                scheduled: {
                    date: 'Required',
                },
            },
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
            profile: {},
            errors: errors,
            messages: errorMessages,
            diff: planningDiff,
        });
        expect(errorMessages).toEqual(['Scheduled updates have to be after the previous updates.']);
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
            profile: {},
            errors: errors,
            messages: errorMessages,
            diff: planningDiff,
        });
        expect(errorMessages).toEqual(['Scheduled updates have to be after the previous updates.']);
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

    describe('coverage custom fields', () => {
        const textField = 'custom_text_field';
        const vocabularyField = 'custom_vocabulary_field';
        let originalVocabularyApi;
        let coverage;

        const getProfile = (fieldId, type, enabled) => ({
            editor: {[fieldId]: {enabled: enabled}},
            schema: {[fieldId]: {type: type, required: true}},
        } as unknown as ICoverageContentProfile);

        beforeEach(() => {
            originalVocabularyApi = superdeskApi.entities.vocabulary;
            Object.assign(superdeskApi.entities, {
                vocabulary: {
                    getAll: () => ({
                        toArray: () => [{_id: textField, display_name: 'Caption', field_type: 'text'}],
                    }),
                },
            });
            sinon.stub(vocabularies, 'getCustomVocabularies').returns([
                {_id: vocabularyField, display_name: 'Image type'},
            ] as Array<IVocabulary>);
            coverage = {planning: {}};
        });

        afterEach(() => {
            Object.assign(superdeskApi.entities, {vocabulary: originalVocabularyApi});
            restoreSinonStub(vocabularies.getCustomVocabularies);
        });

        it('fails if a required custom text field is empty', () => {
            validateCoverageCustomTextFields(
                getProfile(textField, 'custom_text', true),
                errors,
                errorMessages,
                coverage,
            );

            expect(errorMessages).toEqual(['Caption is a required field']);
            expect(errors).toEqual({[textField]: 'This field is required'});
        });

        it('passes if a required custom text field has a value', () => {
            coverage.planning.fields = [{field: textField, value: 'some text'}];

            validateCoverageCustomTextFields(
                getProfile(textField, 'custom_text', true),
                errors,
                errorMessages,
                coverage,
            );

            expect(errorMessages).toEqual([]);
            expect(errors).toEqual({[textField]: null});
        });

        it('ignores a required custom text field removed from the profile', () => {
            validateCoverageCustomTextFields(
                getProfile(textField, 'custom_text', false),
                errors,
                errorMessages,
                coverage,
            );

            expect(errorMessages).toEqual([]);
            expect(errors).toEqual({});
        });

        it('fails if a required custom vocabulary field is empty', () => {
            validateCoverageVocabularyFields(
                getProfile(vocabularyField, 'custom_vocabulary', true),
                errors,
                errorMessages,
                coverage,
            );

            expect(errorMessages).toEqual(['Image type is a required field']);
            expect(errors).toEqual({[vocabularyField]: 'This field is required'});
        });

        it('passes if a required custom vocabulary field has a value in coverage planning', () => {
            coverage.planning.subject = [{name: 'Archive', qcode: 'archive', scheme: vocabularyField}];

            validateCoverageVocabularyFields(
                getProfile(vocabularyField, 'custom_vocabulary', true),
                errors,
                errorMessages,
                coverage,
            );

            expect(errorMessages).toEqual([]);
            expect(errors).toEqual({[vocabularyField]: null});
        });

        it('ignores a required custom vocabulary field removed from the profile', () => {
            validateCoverageVocabularyFields(
                getProfile(vocabularyField, 'custom_vocabulary', false),
                errors,
                errorMessages,
                coverage,
            );

            expect(errorMessages).toEqual([]);
            expect(errors).toEqual({});
        });
    });
});

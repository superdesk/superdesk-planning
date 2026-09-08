import moment from 'moment';
import {get, set, isEqual, isEmpty} from 'lodash';

import {WORKSPACE, WORKFLOW_STATE, PRIVILEGES} from '../constants';
import * as selectors from '../selectors';
import {gettext, getItemInArrayById} from '../utils';

import {getVocabularyItemsForScheme, validateField, validators} from './index';
import type {IPlanningContentProfile, IPlanningCoverageItem, IPlanningItem} from 'interfaces';
import {planningApi, superdeskApi} from '../superdeskApi';
import {getCoverageFields} from '../api/editor/item_planning';
import {vocabularies} from '../api/vocabularies';
import type {Dictionary} from 'superdesk-api';

const validatePlanningScheduleDate = ({getState, field, value, errors, messages, diff, item}) => {
    // Only validate the schedule if it has changed
    if (moment(get(item, field)).isSame(moment(get(diff, field)))) {
        return;
    }

    const privileges = selectors.general.privileges(getState());
    const canCreateInPast = !!privileges[PRIVILEGES.CREATE_IN_PAST];
    const today = moment();

    if (moment.isMoment(value) && value.isBefore(today, 'day')) {
        set(errors, `${field}.date`, gettext('Planning date is in the past'));

        if (!canCreateInPast) {
            messages.push(gettext('PLANNING DATE cannot be in the past'));
        }
    }
};

/**
 * The purpose of v2 is to have a interface cleaner
 * and reduce the number of arguments that have to be passed.
 */
export function validateCoveragesV2(value: Array<IPlanningCoverageItem>) {
    let errors = {};
    let messages = [];

    const store = planningApi.redux.store;

    validateCoverages({
        dispatch: store.dispatch,
        getState: store.getState,
        value: value,
        diff: {
            coverages: value,
        },
        item: {},
        errors: errors,
        messages: messages,
    });

    return {errors, messages};
}

interface IValidateCoverages {
    dispatch: any;
    getState: any;
    value: Array<IPlanningCoverageItem>;
    errors: any;
    messages: any;
    diff: Partial<IPlanningItem>;
    item: Partial<IPlanningItem>;
}

export const validateCoverages = ({
    dispatch,
    getState,
    value: coverages,
    errors,
    messages,
    diff,
    item,
}: IValidateCoverages) => {
    const error: Dictionary<string, string> = {};
    const handleErrors = () => {
        if (!isEqual(error, {})) {
            errors.coverages = error;
        } else if (errors.coverages) {
            delete errors.coverages;
        }
    };

    if (Array.isArray(coverages) === false) {
        handleErrors();
        return;
    }

    coverages.forEach((coverage, index) => {
        const originalCoverage = getItemInArrayById(
            get(item, 'coverages') || [],
            get(coverage, 'coverage_id'),
            'coverage_id'
        );
        const coverageProfile = getCoverageFields(coverage.planning.g2_content_type).profile;

        validateCoverageVocabularyFields(coverageProfile, errors, messages, diff.coverages[index]);
        validateCoverageCustomTextFields(coverageProfile, errors, messages, diff.coverages[index]);

        const isValidSubject = coverageProfile.schema['subject']?.required
            ? !isEmpty((diff.coverages[index].subject ?? []).filter((x) => x.scheme == null))
            : true;

        if (!isValidSubject) {
            set(error, `${index}.subject`, gettext('Field is required'));
            messages.push(gettext('Subject is a required field'));
        } else {
            delete error?.[index]?.['subject'];
        }

        Object.entries(validators.coverage).forEach(([key, val]) => {
            const coverageErrors = {};
            const keyName = ['news_coverage_status', 'scheduled_updates'].includes(key) ? key : `planning.${key}`;
            const original = get(originalCoverage, keyName);
            const value = get(coverage, keyName);

            if (key === 'scheduled' && original !== undefined && isEqual(original, value)) {
                // Only validate scheduled date if it has changed
                return;
            } else if (get(coverage, 'planning.g2_content_type') !== 'text' && key === 'genre') {
                // Only validate Genre if the content type is Text
                return;
            }

            validateField({
                profileName: 'coverage',
                dispatch: dispatch,
                getState: getState,
                field: key,
                value: value,
                profile: coverageProfile,
                errors: coverageErrors,
                messages: messages,
                diff: diff,
            });

            if (coverageErrors?.[key] !== null) {
                set(error, `${index}.${keyName}`, coverageErrors[key]);
            }
        });
    });

    handleErrors();
};

export const validateCoverageVocabularyFields = (
    coverageProfile: IPlanningContentProfile,
    errors: Dictionary<string, string>,
    messages: Array<string>,
    diff: IPlanningCoverageItem,
): void => {
    const vocabularyLabels = new Map(vocabularies.getCustomVocabularies().map((x) => [x._id, x.display_name]));

    Object.keys(coverageProfile.schema).filter((fieldId) => {
        const hasNoDefinedValidator = !validators['coverage'][fieldId];
        const isCustomVocabulary = coverageProfile.schema[fieldId].type === 'custom_vocabulary';

        return hasNoDefinedValidator && isCustomVocabulary;
    })
        .forEach((fieldId) => {
            const isInvalid = coverageProfile.schema[fieldId].required
                ? isEmpty(getVocabularyItemsForScheme(diff, fieldId))
                : false;

            if (isInvalid) {
                errors[fieldId] = gettext('This field is required');
                messages.push(gettext('{{ key }} is a required field', {key: vocabularyLabels.get(fieldId)}));
            } else {
                errors[fieldId] = null;
            }
        });
};

/**
 * Takes configured custom text fields and reads coverage fields from profile schema.
 * Reads the latest coverage data that's in sync with the editor UI, checks each field
 * that is custom text if it's required and empty. If there's an error it's pushed to errors object,
 * later used for generating UI alerts.
 */
export const validateCoverageCustomTextFields = (
    coverageProfile: IPlanningContentProfile,
    errors: Dictionary<string, string>,
    messages: Array<string>,
    diff: IPlanningCoverageItem,
): void => {
    const customTextFieldLabels = new Map(
        superdeskApi.entities.vocabulary.getAll().toArray()
            .filter((x) => x.field_type === 'text')
            .map((x) => [x._id, x.display_name])
    );

    Object.keys(coverageProfile.schema).filter((fieldId) => {
        const hasNoDefinedValidator = !validators['coverage'][fieldId];
        const isCustomTextField = coverageProfile.schema[fieldId].type === 'custom_text';

        return hasNoDefinedValidator && isCustomTextField;
    })
        .forEach((fieldId) => {
            const isInvalid = coverageProfile.schema[fieldId].required
                ? isEmpty((diff.planning?.fields ?? []).find((x) => x.field === fieldId)?.value)
                : false;

            if (isInvalid) {
                errors[fieldId] = gettext('This field is required');

                messages.push(
                    gettext(
                        '{{ key }} is a required field',
                        {key: customTextFieldLabels.get(fieldId) ?? fieldId},
                    ),
                );
            } else {
                errors[fieldId] = null;
            }
        });
};


const validateCoverageScheduleDate = ({
    getState,
    field,
    value,
    profile,
    errors,
    messages,
}) => {
    if (profile?.schema?.scheduled?.required && (!moment.isMoment(value) || !value.isValid())) {
        set(errors, 'planning.scheduled.date', gettext('Required'));
        messages.push(gettext('COVERAGE SCHEDULE is required'));

        return;
    }

    let validateSchedule = true;
    const newsItem = get(selectors.general.modalProps(getState()), 'newsItem', null);

    if (selectors.general.currentWorkspace(getState()) === WORKSPACE.AUTHORING && newsItem) {
        if ([WORKFLOW_STATE.SCHEDULED, 'published'].includes(newsItem.state)) {
            // We don't validate if newsitem is published/scheduled in add-to-planning modal
            validateSchedule = false;
        }
    }

    const privileges = selectors.general.privileges(getState());
    const canCreateInPast = !!privileges[PRIVILEGES.CREATE_IN_PAST];
    const today = moment();

    if (!field.endsWith('_scheduledTime') &&
        validateSchedule && moment.isMoment(value) && value.isBefore(today, 'day')) {
        set(errors, `${field}.date`, gettext('Date is in the past'));

        if (!canCreateInPast) {
            messages.push(gettext('COVERAGE SCHEDULED DATE cannot be in the past'));
        }
    }
};

const validateScheduledUpdatesDate = ({
    getState,
    field,
    value,
    profile,
    errors,
    messages,
    diff,
}) => {
    const coverageSchedule = get(get(diff, 'coverages', []).find((c) =>
        c.coverage_id === get(value, '[0].coverage_id')), 'planning.scheduled');

    errors.scheduled_updates = {};
    const planningSchedules = (value || []).map((v) => get(v, 'planning')).reverse();
    let requiredMissing, scheduleConflict;


    planningSchedules.forEach((planningSchedule, index) => {
        const schedule = get(planningSchedule, 'scheduled');
        const scheduledIndex = planningSchedules.length - 1 - index;
        const _scheduledTime = get(planningSchedule, '_scheduledTime');

        if (get(profile, 'schema.scheduled_updates_scheduled.required')) {
            if (!schedule || !_scheduledTime) {
                requiredMissing = true;
                errors.scheduled_updates[scheduledIndex] = {planning: {}};
                if (!schedule) {
                    errors.scheduled_updates[scheduledIndex].planning.scheduled = {date: gettext('Required')};
                }

                if (!_scheduledTime) {
                    errors.scheduled_updates[scheduledIndex].planning._scheduledTime = gettext('Required');
                }
            }
        }

        if (schedule && _scheduledTime) {
            const previousSchedule = schedule ? get((planningSchedules.slice(index + 1)).find((s) => s.scheduled),
                'scheduled') : null;

            if ((coverageSchedule && schedule <= coverageSchedule) ||
                (previousSchedule && schedule <= previousSchedule)) {
                errors.scheduled_updates[planningSchedules.length - 1 - index] = {
                    planning: {
                        _scheduledTime: gettext('Should be after the previous scheduled update/coverage'),
                        scheduled: {
                            date: gettext('Should be after the previous scheduled update/coverage'),
                        },
                    },
                };
                scheduleConflict = true;
            }
        }
    });

    if (isEmpty(errors.scheduled_updates)) {
        delete errors.scheduled_updates;
    } else {
        if (scheduleConflict) {
            messages.push(gettext('Scheduled updates have to be after the previous updates.'));
        }

        if (requiredMissing) {
            messages.push(gettext('Scheduled updates should have a date/time.'));
        }
    }
};

export default {
    validatePlanningScheduleDate,
    validateCoverages,
    validateScheduledUpdatesDate,
    validateCoverageScheduleDate,
};

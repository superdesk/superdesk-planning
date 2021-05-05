import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {superdeskApi} from '../../superdeskApi';

import {ModalWithForm} from '../index';
import {
    SpikeEventForm,
    UnspikeEventForm,
    UpdateRecurringEventsForm,
    CancelEventForm,
    PostponeEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    ConvertToRecurringEventForm,
    SpikePlanningForm,
    UnspikePlanningForm,
    CancelPlanningCoveragesForm,
    UpdateAssignmentForm,
    EditPriorityForm,
    UpdateEventRepetitionsForm,
    PostEventsForm,
    CreatePlanningForm,
    AssignCalendarForm,
    CancelCoverageForm,
} from './index';
import {EVENTS, PLANNING, ASSIGNMENTS, COVERAGES} from '../../constants';

export class ItemActionConfirmationModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {canSave: false};

        this.enableSaveInModal = this.enableSaveInModal.bind(this);
        this.disableSaveInModal = this.disableSaveInModal.bind(this);
    }

    enableSaveInModal() {
        this.setState({canSave: true});
    }

    disableSaveInModal() {
        this.setState({canSave: false});
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {handleHide, modalProps} = this.props;

        let title;
        let form;
        let saveText = gettext('Save');
        let original = modalProps.original || {};
        let updates = modalProps.updates || {};
        const resolve = modalProps.resolve || null;
        const isRecurring = get(modalProps, 'original.recurrence_id');

        const getSaveAndPostTitle = () => {
            const post = get(modalProps, 'original._post', false);
            const save = get(modalProps, 'original._save', true);

            if (save && post)
                return gettext('Save & Post Event');
            else if (post)
                return gettext('Post Event');
            return gettext('Save Event');
        };

        const modalFormsMapper = {
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: {
                title: gettext('Spike {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                saveText: gettext('Spike'),
                form: SpikeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: {
                title: gettext('Unspike {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                saveText: gettext('Unspike'),
                form: UnspikeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: {
                title: gettext('Cancel {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                saveText: gettext('Cancel Event'),
                form: CancelEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: {
                title: gettext('Update time of {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                form: UpdateTimeForm,
                saveText: gettext('Update Time'),
            },
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: {
                title: gettext('Reschedule {{event}}',
                    {event: isRecurring ? gettext('a Recurring Event') : gettext('an Event')}),
                saveText: gettext('Reschedule'),
                form: RescheduleEventForm,
            },
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: {
                title: gettext('Postpone {{event}}',
                    {event: isRecurring ? gettext('a Recurring Event') : gettext('an Event')}),
                saveText: gettext('Postpone'),
                form: PostponeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: {
                title: EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label,
                form: ConvertToRecurringEventForm,
                saveText: gettext('Convert to a recurring event'),
            },
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]: {
                title: gettext('Update Repetitions of the Series'),
                saveText: gettext('Update Repetitions'),
                form: UpdateEventRepetitionsForm,
            },
            [EVENTS.ITEM_ACTIONS.POST_EVENT.actionName]: {
                title: gettext('{{action}} {{event}}', {
                    action: get(original, '_post', true) ? gettext('Post') : gettext('Unpost'),
                    event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event'),
                }),
                saveText: get(original, '_post', true) ? gettext('Post') : gettext('Unpost'),
                form: PostEventsForm,
            },
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: {
                title: modalProps.title,
                saveText: gettext('Create'),
                form: CreatePlanningForm,
            },
            [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]: {
                title: gettext('Assign "{{calendar}}" Calendar to Series', {
                    calendar: get(updates, '_calendar.name') || '',
                }),
                saveText: gettext('Assign Calendar'),
                form: AssignCalendarForm,
            },
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: {
                title: gettext('Spike Planning Item'),
                saveText: gettext('Spike'),
                form: SpikePlanningForm,
            },
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: {
                title: gettext('Unspike Planning Item'),
                saveText: gettext('Unspike'),
                form: UnspikePlanningForm,
            },
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: {
                title: PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label,
                form: CancelPlanningCoveragesForm,
                saveText: gettext('Cancel Planning'),
            },
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: {
                title: PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label,
                original: {
                    ...modalProps.original,
                    _cancelAllCoverage: true,
                },
                form: CancelPlanningCoveragesForm,
            },
            [COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE.actionName]: {
                title: modalProps.scheduledUpdate ?
                    gettext('Cancel Scheduled Update') :
                    COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE.label,
                saveText: modalProps.scheduledUpdate ? gettext('Cancel Scheduled Update') :
                    gettext('Cancel Coverage'),
                form: CancelCoverageForm,
            },
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.actionName]: {
                title: ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label,
                form: UpdateAssignmentForm,
            },
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.actionName]: {
                title: ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label,
                form: EditPriorityForm,
            },
        };

        title = get(modalFormsMapper[modalProps.actionType], 'title', getSaveAndPostTitle());
        form = get(modalFormsMapper[modalProps.actionType], 'form', UpdateRecurringEventsForm);
        original = get(modalFormsMapper[modalProps.actionType], 'original', original);
        updates = get(modalFormsMapper[modalProps.actionType], 'updates', updates);
        saveText = get(modalFormsMapper[modalProps.actionType], 'saveText', saveText);

        return (
            <ModalWithForm
                title={title}
                onHide={handleHide}
                form={form}
                original={original}
                updates={updates}
                saveButtonText={saveText}
                cancelButtonText={gettext('Cancel')}
                large={get(modalProps, 'large', false)}
                show={true}
                canSave={this.state.canSave}
                enableSaveInModal={this.enableSaveInModal}
                disableSaveInModal={this.disableSaveInModal}
                modalProps={modalProps}
                resolve={resolve}
            />
        );
    }
}

ItemActionConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        eventDetail: PropTypes.object,
        original: PropTypes.object,
        updates: PropTypes.object,
        planning: PropTypes.object,
        actionType: PropTypes.string,
        large: PropTypes.bool,
        title: PropTypes.string,
        resolve: PropTypes.func,
        scheduledUpdate: PropTypes.object,
    }),
};

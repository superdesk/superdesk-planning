import React from 'react'
import PropTypes from 'prop-types'
import { ModalWithForm } from '../index'
import {
    SpikeEventForm,
    UpdateRecurringEventsForm,
    CancelEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    PostponeEventForm,
    ConvertToRecurringEventForm,
    CancelPlanningCoveragesForm,
    ReassignAssignmentForm,
} from './index'
import { get } from 'lodash'
import { GENERIC_ITEM_ACTIONS, EVENTS, FORM_NAMES, PLANNING, ASSIGNMENTS } from '../../constants'

export const ItemActionConfirmationModal = ({ handleHide, modalProps }) => {
    let title
    let form
    let formNameForPristineCheck
    let saveText = 'Save'
    let propToForm = modalProps.eventDetail

    const getSaveAndPublishTitle = () => {
        const publish = get(modalProps, 'eventDetail._publish', false)
        const save = get(modalProps, 'eventDetail._save', true)
        if (save && publish)
            return 'Save & Publish Event'
        else if (publish)
            return 'Publish Event'
        return 'Save Event'
    }

    switch (modalProps.actionType) {
        case GENERIC_ITEM_ACTIONS.SPIKE.label:
            title = 'Spike an event'
            saveText = 'Spike'
            form = SpikeEventForm
            break

        case EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label:
            title = 'Cancel an event'
            saveText = 'OK'
            form = CancelEventForm
            break

        case EVENTS.ITEM_ACTIONS.UPDATE_TIME.label:
            title = 'Update time'
            form = UpdateTimeForm
            formNameForPristineCheck = FORM_NAMES.UpdateTimeForm
            break

        case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label:
            title = 'Reschedule an event'
            saveText = 'Reschedule'
            form = RescheduleEventForm
            formNameForPristineCheck = FORM_NAMES.RescheduleForm
            break

        case EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label:
            title = 'Postpone an event'
            saveText = 'Postpone'
            form = PostponeEventForm
            break

        case EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label:
            title = EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label
            form = ConvertToRecurringEventForm
            formNameForPristineCheck = FORM_NAMES.ConvertEventToRecurringForm
            break

        case PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label:
            title = PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label
            propToForm = modalProps.planning
            form = CancelPlanningCoveragesForm
            break

        case PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label:
            title = PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label
            propToForm = {
                ...modalProps.planning,
                _cancelAllCoverage: true,
            }
            form = CancelPlanningCoveragesForm
            break

        case ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label:
            title = ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label
            propToForm = modalProps.assignment
            form = ReassignAssignmentForm
            formNameForPristineCheck = FORM_NAMES.ReassignAssignmentForm
            break

        default:
            title = getSaveAndPublishTitle()
            form = UpdateRecurringEventsForm
    }

    return (
        <ModalWithForm
            title={title}
            onHide={handleHide}
            form={form}
            formNameForPristineCheck={formNameForPristineCheck}
            initialValues={propToForm}
            saveButtonText={saveText}
            cancelButtonText="Cancel"
            large={get(modalProps, 'large', false)}
            show={true}/>
    )
}

ItemActionConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        eventDetail: PropTypes.object,
        planning: PropTypes.object,
        actionType: PropTypes.string,
        large: PropTypes.bool,
    }),
}

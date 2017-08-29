import React from 'react'
import PropTypes from 'prop-types'
import { ModalWithForm } from '../index'
import {
    SpikeEventForm,
    UpdateRecurringEventsForm,
    CancelEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    ConvertToRecurringEventForm,
} from './index'
import { get } from 'lodash'
import { GENERIC_ITEM_ACTIONS, EVENTS } from '../../constants'

export const EventActionConfirmationModal = ({ handleHide, modalProps }) => {
    let title
    let form
    let saveText = 'Save'

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
            break

        case EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label:
            title = 'Reschedule an event'
            saveText = 'Reschedule'
            form = RescheduleEventForm
            break

        case EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label:
            title = EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label
            form = ConvertToRecurringEventForm
            break

        default:
            title = get(modalProps, 'eventDetail._publish', false) ?
                'Save Event & Publish' : 'Save Event'
            form = UpdateRecurringEventsForm
    }

    return (
        <ModalWithForm
            title={title}
            onHide={handleHide}
            form={form}
            initialValues={modalProps.eventDetail}
            saveButtonText={saveText}
            cancelButtonText="Cancel"
            large={get(modalProps, 'large', false)}
            show={true}/>
    )
}

EventActionConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        eventDetail: PropTypes.object.isRequired,
        actionType: PropTypes.string,
        large: PropTypes.bool,
    }),
}

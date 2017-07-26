import React from 'react'
import PropTypes from 'prop-types'
import { ModalWithForm } from '../index'
import { UpdateRecurringEventsForm } from './form'
import { get } from 'lodash'

export const UpdateRecurringEventsModal = ({ handleHide, modalProps }) => {
    const title = get(modalProps, 'eventDetail._publish', false) ?
        'Save Event & Publish' : 'Save Event'
    return (
        <ModalWithForm
            title={title}
            onHide={handleHide}
            form={UpdateRecurringEventsForm}
            initialValues={modalProps.eventDetail}
            saveButtonText="Save"
            cancelButtonText="Cancel"
            show={true}/>
    )
}

UpdateRecurringEventsModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({ eventDetail: PropTypes.object.isRequired }),
}

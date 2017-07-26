import React from 'react'
import PropTypes from 'prop-types'
import { ModalWithForm, SpikeEventForm } from '../index'

export const SpikeEventModal = ({ handleHide, modalProps }) => (
    <ModalWithForm
        title="Spike an Event"
        onHide={handleHide}
        form={SpikeEventForm}
        initialValues={modalProps.eventDetail}
        saveButtonText="Spike"
        cancelButtonText="Cancel"
        show={true} />
)

SpikeEventModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({ eventDetail: PropTypes.object.isRequired }),
}

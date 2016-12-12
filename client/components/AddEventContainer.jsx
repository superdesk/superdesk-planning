import React from 'react'
import { ModalWithForm } from './index'
import { connect } from 'react-redux'
import AddEventForm from './AddEventForm'

/**
* Modal for adding/editing an event
*/
export const AddEvent = ({ show, initialValues }) => (
    <ModalWithForm
        title="Add/Edit an event"
        form={AddEventForm}
        initialValues={initialValues}
        show={show} />
)

AddEvent.propTypes = {
    show: React.PropTypes.bool,
    initialValues: React.PropTypes.object,
}

const mapStateToProps = (state) => ({
    show: state.modal.modalType === 'EDIT_EVENT',
    initialValues: state.modal.modalProps && state.modal.modalProps.event
})

export const AddEventContainer = connect(mapStateToProps, null)(AddEvent)

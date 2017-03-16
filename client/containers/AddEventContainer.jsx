import React from 'react'
import { ModalWithForm } from '../components'
import { connect } from 'react-redux'
import { EventForm } from './index'
import * as actions from '../actions'

/**
* Modal for adding/editing an event
*/
export const AddEvent = ({ show, initialValues, handleHide }) => (
    <ModalWithForm
        title="Add/Edit an event"
        form={EventForm}
        onHide={handleHide}
        initialValues={initialValues}
        show={show} />
)

AddEvent.propTypes = {
    show: React.PropTypes.bool,
    initialValues: React.PropTypes.object,
    handleHide: React.PropTypes.func,
}

const mapStateToProps = (state) => ({
    show: state.modal.modalType === 'EDIT_EVENT',
    initialValues: state.modal.modalProps && state.modal.modalProps.event
})

const mapDispatchToProps = (dispatch) => ({
    handleHide: () => dispatch(actions.hideModal())
})

export const AddEventContainer = connect(mapStateToProps, mapDispatchToProps)(AddEvent)

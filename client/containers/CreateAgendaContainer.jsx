import React from 'react'
import {CreateAgendaForm } from './index'
import { ModalWithForm } from '../components'
import { connect } from 'react-redux'
import * as actions from '../actions'

/**
* Modal for adding an agenda
*/
export const CreateAgenda = ({ show, handleHide }) => (
    <ModalWithForm
        title="Create an Agenda"
        onHide={handleHide}
        form={CreateAgendaForm}
        show={show} />
)

CreateAgenda.propTypes = {
    show: React.PropTypes.bool,
    handleHide: React.PropTypes.func,
}

const mapStateToProps = (state) => ({
    show: state.modal.modalType === 'CREATE_AGENDA',
})

const mapDispatchToProps = (dispatch) => ({
    handleHide: () => dispatch(actions.hideModal())
})

export const CreateAgendaContainer = connect(mapStateToProps, mapDispatchToProps)(CreateAgenda)

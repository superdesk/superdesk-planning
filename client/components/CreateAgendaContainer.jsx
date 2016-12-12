import React from 'react'
import { ModalWithForm, CreateAgendaForm } from './index'
import { connect } from 'react-redux'

/**
* Modal for adding an agenda
*/
export const CreateAgenda = ({ show }) => (
    <ModalWithForm
        title="Create an Agenda"
        form={CreateAgendaForm}
        show={show} />
)

CreateAgenda.propTypes = {
    show: React.PropTypes.bool
}

const mapStateToProps = (state) => ({
    show: state.modal.modalType === 'CREATE_AGENDA',
})

export const CreateAgendaContainer = connect(mapStateToProps, null)(CreateAgenda)

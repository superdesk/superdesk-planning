import React from 'react'
import { CreateAgendaForm } from '../containers'
import { ModalWithForm } from './index'

/**
* Modal for adding an agenda
*/
export const CreateAgendaModal = ({ handleHide }) => (
    <ModalWithForm
        title="Create an Agenda"
        onHide={handleHide}
        form={CreateAgendaForm}
        show={true} />
)

CreateAgendaModal.propTypes = { handleHide: React.PropTypes.func }

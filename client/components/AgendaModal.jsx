import React from 'react'
import { ModalWithForm, CreateEditAgendaForm } from './index'

/**
* Modal for adding and editing an agenda
*/
export const AgendaModal = ({ handleHide, modalProps }) => {
    let title = 'Create an Agenda'
    let initialValues = {}

    if (modalProps && modalProps.agenda) {
        const { agenda } = modalProps

        title = 'Edit an Agenda'
        initialValues = agenda
    }

    return (
        <ModalWithForm
            title={title}
            onHide={handleHide}
            form={CreateEditAgendaForm}
            show={true}
            initialValues={initialValues}/>
    )
}

AgendaModal.propTypes = {
    handleHide: React.PropTypes.func,
    modalProps: React.PropTypes.object,
}

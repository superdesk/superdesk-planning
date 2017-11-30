import React from 'react';
import PropTypes from 'prop-types';
import {ModalWithForm, CreateEditAgendaForm} from './index';
import {FORM_NAMES} from '../constants';

/**
* Modal for adding and editing an agenda
*/
export const AgendaModal = ({handleHide, modalProps}) => {
    let title = 'Create an Agenda';
    let initialValues = {};

    if (modalProps && modalProps.agenda) {
        const {agenda} = modalProps;

        title = 'Edit an Agenda';
        initialValues = agenda;
    }

    return (
        <ModalWithForm
            title={title}
            onHide={handleHide}
            form={CreateEditAgendaForm}
            formNameForPristineCheck={FORM_NAMES.CreateEditAgendaForm}
            show={true}
            large={true}
            initialValues={initialValues}/>
    );
};

AgendaModal.propTypes = {
    handleHide: PropTypes.func,
    modalProps: PropTypes.object,
};

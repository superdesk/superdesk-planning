import React from 'react';
import PropTypes from 'prop-types';
import {ModalWithForm} from '../index';
import {
    SpikeEventForm,
    UpdateRecurringEventsForm,
    CancelEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    PostponeEventForm,
    ConvertToRecurringEventForm,
    CancelPlanningCoveragesForm,
    UpdateAssignmentForm,
} from './index';
import {get} from 'lodash';
import {EVENTS, FORM_NAMES, PLANNING, ASSIGNMENTS} from '../../constants';

export const ItemActionConfirmationModal = ({handleHide, modalProps}) => {
    let title;
    let form;
    let formNameForPristineCheck;
    let saveText = 'Save';
    let propToForm = modalProps.eventDetail;

    const getSaveAndPublishTitle = () => {
        const publish = get(modalProps, 'eventDetail._publish', false);
        const save = get(modalProps, 'eventDetail._save', true);

        if (save && publish)
            return 'Save & Publish Event';
        else if (publish)
            return 'Publish Event';
        return 'Save Event';
    };

    const modalFormsMapper = {
        [EVENTS.ITEM_ACTIONS.SPIKE.label]: {
            title: 'Spike an event',
            saveText: 'Spike',
            form: SpikeEventForm,
        },
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: {
            title: 'Cancel an event',
            saveText: 'OK',
            form: CancelEventForm,
        },
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: {
            title: 'Update time',
            form: UpdateTimeForm,
            formNameForPristineCheck: get(FORM_NAMES, 'UpdateTimeForm'),
        },
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: {
            title: 'Reschedule an event',
            saveText: 'Reschedule',
            form: RescheduleEventForm,
            formNameForPristineCheck: get(FORM_NAMES, 'RescheduleForm'),
        },
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label]: {
            title: 'Postpone an event',
            saveText: 'Postpone',
            form: PostponeEventForm,
        },
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: {
            title: get(EVENTS, 'ITEM_ACTIONS.CONVERT_TO_RECURRING.label'),
            form: ConvertToRecurringEventForm,
            formNameForPristineCheck: get(FORM_NAMES, 'ConvertEventToRecurringForm'),
        },
        [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label]: {
            title: get(PLANNING, 'ITEM_ACTIONS.CANCEL_PLANNING.label'),
            propToForm: {...modalProps.planning},
            form: CancelPlanningCoveragesForm,
        },
        [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label]: {
            title: get(PLANNING, 'ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label'),
            propToForm: {
                ...modalProps.planning,
                _cancelAllCoverage: true,
            },
            form: CancelPlanningCoveragesForm,
        },
        [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: {
            title: ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label,
            propToForm: {...modalProps.assignment},
            form: UpdateAssignmentForm,
            formNameForPristineCheck: get(FORM_NAMES, 'UpdateAssignmentForm'),
            customValidation: true,
        },
    };

    modalFormsMapper[ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label] = {
        ...modalFormsMapper[ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label],
        title: ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label,
    };

    title = get(modalFormsMapper[modalProps.actionType], 'title', getSaveAndPublishTitle());
    form = get(modalFormsMapper[modalProps.actionType], 'form', UpdateRecurringEventsForm);
    formNameForPristineCheck = get(modalFormsMapper[modalProps.actionType],
        'formNameForPristineCheck');
    propToForm = get(modalFormsMapper[modalProps.actionType], 'propToForm', propToForm);
    saveText = get(modalFormsMapper[modalProps.actionType], 'saveText', saveText);

    return (
        <ModalWithForm
            title={title}
            onHide={handleHide}
            form={form}
            formNameForPristineCheck={formNameForPristineCheck}
            initialValues={propToForm}
            saveButtonText={saveText}
            cancelButtonText="Cancel"
            large={get(modalProps, 'large', false)}
            show={true}/>
    );
};

ItemActionConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        eventDetail: PropTypes.object,
        planning: PropTypes.object,
        actionType: PropTypes.string,
        large: PropTypes.bool,
    }),
};

import React from 'react';
import PropTypes from 'prop-types';
import {ModalWithForm} from '../index';
import {
    SpikeEventForm,
    UnspikeEventForm,
    UpdateRecurringEventsForm,
    CancelEventForm,
    PostponeEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    ConvertToRecurringEventForm,
    CancelPlanningCoveragesForm,
    UpdateAssignmentForm,
    EditPriorityForm,
    UpdateEventRepetitionsForm,
    PublishEventsForm,
} from './index';
import {get} from 'lodash';
import {EVENTS, PLANNING, ASSIGNMENTS} from '../../constants';
import {gettext} from '../../utils';

export class ItemActionConfirmationModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {canSave: false};

        this.enableSaveInModal = this.enableSaveInModal.bind(this);
        this.disableSaveInModal = this.disableSaveInModal.bind(this);
    }

    enableSaveInModal() {
        this.setState({canSave: true});
    }

    disableSaveInModal() {
        this.setState({canSave: false});
    }

    render() {
        const {handleHide, modalProps} = this.props;

        let title;
        let form;
        let saveText = gettext('Save');
        let propToForm = modalProps.eventDetail;

        const getSaveAndPublishTitle = () => {
            const publish = get(modalProps, 'eventDetail._publish', false);
            const save = get(modalProps, 'eventDetail._save', true);

            if (save && publish)
                return gettext('Save & Publish Event');
            else if (publish)
                return gettext('Publish Event');
            return gettext('Save Event');
        };

        const modalFormsMapper = {
            [EVENTS.ITEM_ACTIONS.SPIKE.label]: {
                title: gettext('Spike an event'),
                saveText: gettext('Spike'),
                form: SpikeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UNSPIKE.label]: {
                title: gettext('Unspike an event'),
                saveText: gettext('Unspike'),
                form: UnspikeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: {
                title: gettext('Cancel an event'),
                saveText: gettext('OK'),
                form: CancelEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: {
                title: gettext('Update time'),
                form: UpdateTimeForm,
            },
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: {
                title: gettext('Reschedule an event'),
                saveText: gettext('Reschedule'),
                form: RescheduleEventForm,
            },
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label]: {
                title: gettext('Postpone an event'),
                saveText: gettext('Postpone'),
                form: PostponeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: {
                title: get(EVENTS, 'ITEM_ACTIONS.CONVERT_TO_RECURRING.label'),
                form: ConvertToRecurringEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label]: {
                title: gettext('Update Event Repetitions'),
                saveText: gettext('Update Repetitions'),
                form: UpdateEventRepetitionsForm,
            },
            [EVENTS.ITEM_ACTIONS.PUBLISH_EVENT.label]: {
                title: gettext('Publish Event'),
                saveText: get(propToForm, '_publish', true) ? gettext('Publish') : gettext('Unpublish'),
                form: PublishEventsForm,
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
            },
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label]: {
                title: ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label,
                form: EditPriorityForm,
                propToForm: {...modalProps.assignment},
            }
        };

        title = get(modalFormsMapper[modalProps.actionType], 'title', getSaveAndPublishTitle());
        form = get(modalFormsMapper[modalProps.actionType], 'form', UpdateRecurringEventsForm);
        propToForm = get(modalFormsMapper[modalProps.actionType], 'propToForm', propToForm);
        saveText = get(modalFormsMapper[modalProps.actionType], 'saveText', saveText);

        return (
            <ModalWithForm
                title={title}
                onHide={handleHide}
                form={form}
                initialValues={propToForm}
                saveButtonText={saveText}
                cancelButtonText={gettext('Cancel')}
                large={get(modalProps, 'large', false)}
                show={true}
                canSave={this.state.canSave}
                enableSaveInModal={this.enableSaveInModal}
                disableSaveInModal={this.disableSaveInModal} />
        );
    }
}

ItemActionConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        eventDetail: PropTypes.object,
        planning: PropTypes.object,
        actionType: PropTypes.string,
        large: PropTypes.bool,
    }),
};

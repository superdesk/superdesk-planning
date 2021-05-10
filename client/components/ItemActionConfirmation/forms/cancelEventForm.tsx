import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, isEmpty} from 'lodash';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {eventUtils, gettext} from '../../../utils';
import {EVENTS} from '../../../constants';

import {EventScheduleSummary} from '../../Events';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import {formProfile} from '../../../validators';
import '../style.scss';


export class CancelEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EVENTS.UPDATE_METHODS[0],
            reason: '',
            relatedEvents: [],
            relatedPlannings: [],
            errors: {},
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        this.updatePlanningList(this.state.eventUpdateMethod);

        // Enable save so that the user can action on this event.
        get(this.props, 'formProfile.schema.reason.required', false) ?
            this.props.disableSaveInModal() : this.props.enableSaveInModal();
    }

    updatePlanningList(updateMethod) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            updateMethod
        );

        this.setState({
            eventUpdateMethod: updateMethod,
            relatedEvents: event._events,
            relatedPlannings: event._relatedPlannings,
        });
    }

    submit() {
        const reason = this.state.reason ?
            (gettext('Event Cancelled: ') + this.state.reason) :
            this.state.reason;

        return this.props.onSubmit(
            this.props.original,
            {
                update_method: this.state.eventUpdateMethod,
                reason: reason,
            }
        );
    }

    onEventUpdateMethodChange(field, option) {
        this.updatePlanningList(option);
    }

    onReasonChange(field, reason) {
        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];

        if (this.props.formProfile) {
            formProfile(
                {
                    field: field,
                    value: reason,
                    profile: this.props.formProfile,
                    errors: errors,
                    messages: errorMessages,
                }
            );

            if (get(errorMessages, 'length', 0) > 0 ||
                (get(this.props.formProfile, 'schema.reason.required', false) && isEmpty(reason))) {
                this.props.disableSaveInModal();
            } else {
                this.props.enableSaveInModal();
            }
        }

        this.setState({
            reason,
            errors,
        });
    }

    render() {
        const {original, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;

        const numEvents = this.state.relatedEvents.length + 1;
        const numPlannings = this.state.relatedPlannings.length;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline}
                    noPadding={true}
                    className="slugline"
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={original.dates}
                    forUpdating={true}
                    useEventTimezone={true}
                />

                <Row
                    enabled={isRecurring}
                    label={gettext('No. of Events')}
                    value={numEvents}
                    noPadding={true}
                />

                <Row
                    enabled={!!numPlannings}
                    label={gettext('Planning Items')}
                    value={numPlannings}
                    noPadding={true}
                />

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={gettext('Cancel all recurring events or just this one?')}
                    relatedPlannings={this.state.relatedPlannings}
                    showSpace={false}
                    readOnly={submitting}
                    action="cancel"
                />

                <Row>
                    <TextAreaInput
                        label={gettext('Reason for Event cancellation:')}
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                        field="reason"
                        showErrors={true}
                        errors={this.state.errors}
                        formProfile={this.props.formProfile}
                        required={get(this.props.formProfile, 'schema.reason.required', false)}
                        initialFocus={true}
                    />
                </Row>
            </div>
        );
    }
}

CancelEventComponent.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    original: PropTypes.object.isRequired,
    relatedEvents: PropTypes.array,
    relatedPlannings: PropTypes.array,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    submitting: PropTypes.bool,
    modalProps: PropTypes.object,
    formProfile: PropTypes.object,
};

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventCancelProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates) => dispatch(
        actions.events.ui.cancelEvent(original, updates)
    ),
    onHide: (original, modalProps) => {
        const promise = original.lock_action === EVENTS.ITEM_ACTIONS.CANCEL_EVENT.lock_action ?
            dispatch(actions.events.api.unlock(original)) :
            Promise.resolve(original);

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
});

export const CancelEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(CancelEventComponent);

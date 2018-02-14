import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {eventUtils, gettext} from '../../../utils';
import {EVENTS} from '../../../constants';
import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import '../style.scss';

export class CancelAndPostponeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EventUpdateMethods[0],
            reason: '',
            relatedEvents: [],
            relatedPlannings: [],
            submitting: false,
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
            EventUpdateMethods[0]);

        this.setState({
            relatedEvents: event._events,
            relatedPlannings: event._relatedPlannings,
        });

        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        this.props.onSubmit({
            ...this.props.initialValues,
            update_method: this.state.eventUpdateMethod,
            reason: this.state.reason,
        });
    }

    onEventUpdateMethodChange(field, option) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
            option);

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
        });
    }

    onReasonChange(field, reason) {
        this.setState({reason});
    }

    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const isPostpone = initialValues.lock_action === EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action;

        let updateMethodLabel = isPostpone ?
            gettext('Would you like to postpone all recurring events or just this one?') :
            gettext('Would you like to cancel all recurring events or just this one?');

        let reasonLabel = isPostpone ?
            gettext('Reason for Event postponement:') :
            gettext('Reason for Event cancellation:');

        const numEvents = this.state.relatedEvents.length + 1;
        const numPlannings = this.state.relatedPlannings.length;

        return (
            <div className="ItemActionConfirmation">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline}
                    noPadding={true}
                    className="slugline"
                />

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                />

                <Row
                    enabled={isRecurring}
                    label={gettext('No. of Events')}
                    value={numEvents}
                    noPadding={true}
                />

                <Row
                    enabled={!!numPlannings}
                    label={gettext('No. of Plannings')}
                    value={numPlannings}
                    noPadding={true}
                />

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={updateMethodLabel}
                    relatedPlannings={this.state.relatedPlannings}
                    showSpace={false}
                    readOnly={this.state.submitting}
                    action={isPostpone ? 'postpone' : 'cancel'}
                />

                <Row label={reasonLabel}>
                    <TextAreaInput
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={this.state.submitting}
                    />
                </Row>
            </div>
        );
    }
}

CancelAndPostponeEventComponent.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedEvents: PropTypes.array,
    relatedPlannings: PropTypes.array,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    enableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    submitting: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action) {
            return dispatch(actions.events.ui.postponeEvent(event));
        } else {
            return dispatch(actions.events.ui.cancelEvent(event));
        }
    },
    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.CANCEL_EVENT.lock_action ||
            event.lock_action === EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action) {
            return dispatch(actions.events.api.unlock(event));
        }
    },
});

export const CancelAndPostponeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(CancelAndPostponeEventComponent);

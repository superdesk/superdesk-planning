import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {eventUtils, gettext} from '../../../utils';
import {EVENTS} from '../../../constants';

import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';

import '../style.scss';

export class CancelEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EventUpdateMethods[0],
            reason: '',
            relatedEvents: [],
            relatedPlannings: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            EventUpdateMethods[0]
        );

        this.setState({
            relatedEvents: event._events,
            relatedPlannings: event._relatedPlannings,
        });

        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
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
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            option
        );

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
        });
    }

    onReasonChange(field, reason) {
        this.setState({reason});
    }

    render() {
        const {original, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;

        const numEvents = this.state.relatedEvents.length + 1;
        const numPlannings = this.state.relatedPlannings.length;

        return (
            <div className="ItemActionConfirmation">
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
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
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

                <Row label={gettext('Reason for Event cancellation:')}>
                    <TextAreaInput
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                        field="reason"
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
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    enableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    submitting: PropTypes.bool,
    modalProps: PropTypes.object,
};

const mapStateToProps = (state) => ({
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
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
    {withRef: true}
)(CancelEventComponent);

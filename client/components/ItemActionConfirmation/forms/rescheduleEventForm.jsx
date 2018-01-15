import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {eventValidators} from '../../../validators';
import {getDateFormat, getTimeFormat, getMaxRecurrentEvents} from '../../../selectors/config';
import '../style.scss';
import {eventUtils, gettext} from '../../../utils';
import {EventScheduleSummary, EventUpdateMethods, EventScheduleInput} from '../../Events';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import {set, isEqual, cloneDeep} from 'lodash';

export class RescheduleEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: null,
            eventUpdateMethod: EventUpdateMethods[0],
            reason: '',
            relatedEvents: [],
            relatedPlannings: [],
            submitting: false,
            errors: null,
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
            EventUpdateMethods[0]);

        this.setState({
            diff: {dates: cloneDeep(event.dates)},
            relatedEvents: event._events,
            relatedPlannings: event._relatedPlannings,
        });

        this.currentDate = cloneDeep(this.props.initialValues.dates);
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

    onDatesChange(field, val) {
        const diff = Object.assign({}, this.state.diff);

        if (field === 'dates.recurring_rule' && !val) {
            delete diff.dates.recurring_rule;
        } else {
            set(diff, field, val);
        }

        const validtionErrors = eventValidators.validateEventDates(diff.dates,
            this.props.maxRecurrentEvents);

        let newStateErrors = null;

        if (validtionErrors.hasErrors) {
            newStateErrors = validtionErrors.data;
        }

        this.setState({
            diff: diff,
            errors: newStateErrors,
        });

        if (isEqual(diff.dates, this.props.initialValues.dates) ||
            (diff.dates.recurring_rule &&
            !diff.dates.recurring_rule.until && !diff.dates.recurring_rule.count) ||
            validtionErrors.hasErrors) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        let updatedEvent = {
            ...this.props.initialValues,
            ...this.state.diff,
            reason: this.state.reason,
        };

        if (this.props.initialValues.recurrence_id) {
            updatedEvent.update_method = this.state.eventUpdateMethod;
        }

        this.props.onSubmit(updatedEvent);
    }


    render() {
        const {initialValues, dateFormat, timeFormat, maxRecurrentEvents} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const updateMethodLabel = gettext('Would you like to reschedule all recurring events or just this one?');
        const multiEvent = this.state.eventUpdateMethod.value !== EventUpdateMethods[0].value;
        let reasonLabel = gettext('Reason for rescheduling this event:');

        if (multiEvent) {
            reasonLabel = gettext('Reason for rescheduling these events:');
        }

        const numEvents = this.state.relatedEvents.length + 1;
        const numPlannings = this.state.relatedPlannings.length;

        return (
            <div className="ItemActionConfirmation">
                {initialValues.slugline && (
                    <Row
                        label={gettext('Slugline')}
                        value={initialValues.slugline || ''}
                        noPadding={true}
                        className="slugline"
                    />
                )}

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={this.currentDate}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                    forUpdating={true}
                />

                {isRecurring && (
                    <Row
                        label={gettext('No. of Events')}
                        value={numEvents}
                        noPadding={true}
                    />
                )}

                {!!numPlannings && (
                    <Row
                        label={gettext('No. of Plannings')}
                        value={numPlannings}
                        noPadding={true}
                    />
                )}

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={updateMethodLabel}
                    relatedPlannings={this.state.relatedPlannings}
                    showSpace={false}
                    readOnly={this.state.submitting}
                    action="cancel" />

                <EventScheduleInput
                    item={initialValues}
                    diff={this.state.diff}
                    onChange={this.onDatesChange.bind(this)}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    showRepeat={multiEvent}
                    showRepeatToggle={false}
                    maxRecurrentEvents={maxRecurrentEvents} />

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

RescheduleEventComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    maxRecurrentEvents: PropTypes.number.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
};


const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
    maxRecurrentEvents: getMaxRecurrentEvents(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.rescheduleEvent(event)),
    onHide: (event) => dispatch(actions.events.api.unlock(event)),
});

export const RescheduleEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(RescheduleEventComponent);

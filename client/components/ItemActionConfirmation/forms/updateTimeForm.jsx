import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {eventUtils, gettext} from '../../../utils';
import {Label, TimeInput, Row as FormRow, LineInput} from '../../UI/Form/';
import {Row} from '../../UI/Preview/';
import {EventUpdateMethods, EventScheduleSummary} from '../../Events';
import '../style.scss';
import {get} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EVENTS} from '../../../constants';

export class UpdateTimeComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fromTime: null,
            toTime: null,
            eventUpdateMethod: EventUpdateMethods[0],
            relatedEvents: [],
            submitting: false,
            error: false,
        };
    }

    componentWillMount() {
        let relatedEvents = [];

        if (get(this.props, 'initialValues.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
                EventUpdateMethods[0]);

            relatedEvents = event._events;
        }

        this.setState({
            fromTime: get(this.props.initialValues, 'dates.start'),
            toTime: get(this.props.initialValues, 'dates.end'),
            relatedEvents: relatedEvents,
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

    onChange(field, value) {
        let isPristine, error = isPristine = false;
        let {toTime, fromTime} = this.state;

        if (field === 'fromTime') {
            if (!this.state.toTime) {
                isPristine = true;
            } else {
                error = eventUtils.validateEventDates(value, this.state.toTime);
            }

            fromTime = value;
            this.setState({
                fromTime: value,
                error: error,
            });
        } else {
            if (!this.state.fromTime) {
                isPristine = true;
            } else {
                error = eventUtils.validateEventDates(this.state.fromTime, value);
            }

            toTime = value;
            this.setState({
                toTime: value,
                error: error,
            });
        }

        if (isPristine ||
            (toTime.isSame(get(this.props.initialValues, 'dates.end')) &&
            fromTime.isSame(get(this.props.initialValues, 'dates.start'))) ||
            error) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        let updatedEvent = {...this.props.initialValues};

        updatedEvent.dates.start = this.state.fromTime;
        updatedEvent.dates.end = this.state.toTime;

        if (this.props.initialValues.recurrence_id) {
            updatedEvent.update_method = this.state.eventUpdateMethod;
        }

        this.props.onSubmit(updatedEvent);
    }

    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const updateMethodLabel = gettext('Would you like to update all recurring events or just this one?');
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

        return (
            <div className="MetadataView">
                {initialValues.slugline && (
                    <Row
                        label={gettext('Slugline')}
                        value={initialValues.slugline || ''}
                        className="slugline"
                        noPadding={true}
                    />
                )}

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <EventScheduleSummary
                    schedule={initialValues.dates}
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

                <FormRow flex={true} halfWidth={true} noPadding={true}>
                    <Label text={gettext('From')} row={true}/>
                    <TimeInput
                        field="fromTime"
                        value={this.state.fromTime}
                        onChange={this.onChange.bind(this)}
                        noMargin={true}
                        timeFormat={timeFormat} />
                </FormRow>

                <FormRow flex={true} halfWidth={true}>
                    <Label text={gettext('To')} row={true}/>
                    <TimeInput
                        field="toTime"
                        value={this.state.toTime}
                        onChange={this.onChange.bind(this)}
                        noMargin={true}
                        timeFormat={timeFormat} />
                </FormRow>
                {this.state.error && <FormRow>
                    <LineInput invalid={this.state.error}
                        message="To date should be greater than From date"
                        readOnly={true} />
                </FormRow>}

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange.bind(this)}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={updateMethodLabel}
                    showSpace={false}
                    readOnly={this.state.submitting}
                    action="update time" />
            </div>
        );
    }
}

UpdateTimeComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => dispatch(actions.events.ui.saveAndPublish(
        event,
        get(event, '_save', true),
        get(event, '_publish', false)
    ))
        .then(() => {
            dispatch({
                type: EVENTS.ACTIONS.UNLOCK_EVENT,
                payload: {event},
            });
        }),

    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.UPDATE_TIME.lock_action) {
            dispatch(actions.events.api.unlock(event));
        }
    },
});

export const UpdateTimeForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateTimeComponent);

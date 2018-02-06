import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {validateItem} from '../../../validators';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import '../style.scss';
import {eventUtils, gettext} from '../../../utils';
import {EventScheduleSummary, EventUpdateMethods, EventScheduleInput} from '../../Events';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {Row} from '../../UI/Preview';
import {TextAreaInput, Field} from '../../UI/Form';
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
            errors: {},
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onReasonChange = this.onReasonChange.bind(this);
        this.onDatesChange = this.onDatesChange.bind(this);
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

        const errors = cloneDeep(this.state.errors);

        this.props.onValidate(
            diff,
            this.props.formProfiles,
            errors
        );

        this.setState({
            diff: diff,
            errors: errors,
        });

        if (isEqual(diff.dates, this.props.initialValues.dates) ||
            (diff.dates.recurring_rule &&
            !diff.dates.recurring_rule.until && !diff.dates.recurring_rule.count) ||
            !isEqual(errors, {})
        ) {
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
        const {initialValues, dateFormat, timeFormat} = this.props;
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
            <div className="MetadataView">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline || ''}
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
                    schedule={this.currentDate}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                    forUpdating={true}
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
                    action="cancel" />

                <Field
                    component={EventScheduleInput}
                    field="dates"
                    item={this.state.diff}
                    diff={this.state.diff}
                    onChange={this.onDatesChange}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    showRepeat={multiEvent}
                    showRepeatToggle={false}
                    showErrors={true}
                    errors={this.state.errors}
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

RescheduleEventComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,

    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
};


const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
    formProfiles: selectors.forms.profiles(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.rescheduleEvent(event)),
    onHide: (event) => dispatch(actions.events.api.unlock(event)),

    onValidate: (item, profile, errors) => dispatch(validateItem('events', item, profile, errors, ['dates']))
});

export const RescheduleEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(RescheduleEventComponent);

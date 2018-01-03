import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {eventUtils, gettext} from '../../../utils';
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
        const updateMethodLabel = gettext('Would you like to cancel all recurring events or just this one?');
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
                    schedule={initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
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

                <Row label={gettext('Reason for Event cancellation:')}>
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

CancelEventComponent.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedEvents: PropTypes.array,
    relatedPlannings: PropTypes.array,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    submitting: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    timeFormat: selectors.general.timeFormat(state),
    dateFormat: selectors.general.dateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.cancelEvent(event)),
    onHide: (event) => {
        if (event.lock_action === 'cancel_event') {
            dispatch(actions.events.api.unlock(event));
        }
    },
});

export const CancelEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(CancelEventComponent);

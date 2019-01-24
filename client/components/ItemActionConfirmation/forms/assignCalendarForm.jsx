import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {eventUtils, gettext} from '../../../utils';
import {Row} from '../../UI/Preview';
import '../style.scss';

export class AssignCalendarComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EventUpdateMethods[0],
            relatedEvents: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.initialValues,
            EventUpdateMethods[0],
            true
        );

        this.setState({relatedEvents: event._events});

        // Enable save so that the user can update just this event.
        this.props.enableSaveInModal();
    }

    onEventUpdateMethodChange(field, option) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.initialValues,
            option,
            true
        );

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
        });
    }

    submit() {
        const initialValues = this.props.initialValues;

        // Send the required fields and calendar only
        return this.props.onSubmit({
            _id: initialValues._id,
            type: initialValues.type,
            calendars: initialValues.calendars,
            update_method: this.state.eventUpdateMethod,
        });
    }

    render() {
        const {initialValues, dateFormat, timeFormat, submitting} = this.props;
        const numEvents = this.state.relatedEvents.length + 1;

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
                    schedule={initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                />

                <Row
                    enabled={true}
                    label={gettext('No. of Events')}
                    value={numEvents}
                    noPadding={true}
                />

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={true}
                    updateMethodLabel={gettext('Update all recurring events or just this one?')}
                    showSpace={false}
                    readOnly={submitting}
                />
            </div>
        );
    }
}

AssignCalendarComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => (
        dispatch(actions.main.save(event, false))
            .then((savedItem) => dispatch(actions.events.api.unlock(savedItem)))
    ),
    onHide: (event) => {
        dispatch(actions.events.api.unlock(event));
    },
});

export const AssignCalendarForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(AssignCalendarComponent);

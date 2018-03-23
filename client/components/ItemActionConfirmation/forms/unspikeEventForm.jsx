import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import '../style.scss';
import {WORKFLOW_STATE} from '../../../constants';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {get} from 'lodash';
import {eventUtils, gettext} from '../../../utils';
import {Row} from '../../UI/Preview';

export class UnspikeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EventUpdateMethods[0],
            relatedEvents: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        if (get(this.props, 'initialValues.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
                EventUpdateMethods[0]);

            this.setState({relatedEvents: event._events});
        }

        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
    }

    onEventUpdateMethodChange(field, option) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
            option);

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
        });
    }

    submit() {
        return this.props.onSubmit({
            ...this.props.initialValues,
            update_method: this.state.eventUpdateMethod,
        });
    }

    render() {
        const {initialValues, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const numEvents = (this.state.relatedEvents.filter(
            (event) => get(event, 'state') === WORKFLOW_STATE.SPIKED)
        ).length + 1;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

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
                />

                <Row
                    enabled={isRecurring}
                    label={gettext('No. of Events')}
                    value={numEvents}
                    noPadding={true}
                />

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={gettext('Unspike all recurring events or just this one?')}
                    showSpace={false}
                    readOnly={submitting}
                    action="spike" />
            </div>
        );
    }
}

UnspikeEventComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};


const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => (dispatch(actions.events.ui.unspike(event))),
});

export const UnspikeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true})(UnspikeEventComponent);

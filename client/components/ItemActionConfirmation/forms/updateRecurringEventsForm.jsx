import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {get} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {eventUtils, gettext} from '../../../utils';
import {Row} from '../../UI/Preview';
import '../style.scss';

export class UpdateRecurringEventsComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EventUpdateMethods[0],
            relatedEvents: [],
            submitting: false,
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        if (get(this.props, 'initialValues.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
                EventUpdateMethods[0]);

            this.setState({relatedEvents: event._events});
        }

        // Enable save so that the user can update just this event.
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
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        this.props.onSubmit({
            ...this.props.initialValues,
            update_method: this.state.eventUpdateMethod,
        });
    }

    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const updateMethodLabel = gettext('Update all recurring events or just this one?');
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

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
                    updateMethodLabel={updateMethodLabel}
                    showSpace={false}
                    readOnly={this.state.submitting}
                    action="spike" />
            </div>
        );
    }
}

UpdateRecurringEventsComponent.propTypes = {
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
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.saveAndPublish(
        event,
        {
            save: get(event, '_save', true),
            publish: get(event, '_publish', false),
            unpublish: get(event, '_unpublish', false),
        }
    )),
});

export const UpdateRecurringEventsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateRecurringEventsComponent);

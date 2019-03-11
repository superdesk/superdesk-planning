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
            relatedPlannings: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        const isRecurring = get(this.props, 'original.recurrence_id');

        if (isRecurring || eventUtils.eventHasPlanning(this.props.original)) {
            this.posting = get(this.props.original, '_post', true);
            const event = isRecurring ?
                eventUtils.getRelatedEventsForRecurringEvent(
                    this.props.original,
                    EventUpdateMethods[0],
                    true
                ) :
                this.props.original;

            this.setState({
                relatedEvents: event._events,
                relatedPlannings: this.posting ? [] : event._relatedPlannings,
            });
        }

        // Enable save so that the user can update just this event.
        this.props.enableSaveInModal();
    }

    onEventUpdateMethodChange(field, option) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            option,
            true
        );

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
            relatedPlannings: this.posting ? [] : event._relatedPlannings,
        });
    }

    submit() {
        return this.props.onSubmit(
            this.props.original,
            {
                ...this.props.updates,
                update_method: this.state.eventUpdateMethod,
            }
        );
    }

    render() {
        const {original, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
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

                <UpdateMethodSelection
                    value={this.state.eventUpdateMethod}
                    onChange={this.onEventUpdateMethodChange}
                    showMethodSelection={isRecurring}
                    updateMethodLabel={gettext('Update all recurring events or just this one?')}
                    showSpace={false}
                    readOnly={submitting}
                    action="unpost"
                    relatedPlannings={this.state.relatedPlannings} />
            </div>
        );
    }
}

UpdateRecurringEventsComponent.propTypes = {
    original: PropTypes.object.isRequired,
    updates: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    resolve: PropTypes.func,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: (original, updates) => (
        dispatch(actions.main.save(original, updates, false))
            .then((savedItem) => {
                if (ownProps.modalProps.unlockOnClose) {
                    dispatch(actions.events.api.unlock(savedItem));
                }

                if (ownProps.resolve) {
                    ownProps.resolve(savedItem);
                }
            })
    ),
    onHide: (event) => {
        if (ownProps.modalProps.unlockOnClose) {
            dispatch(actions.events.api.unlock(event));
        }

        if (ownProps.resolve) {
            ownProps.resolve();
        }
    },
});

export const UpdateRecurringEventsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateRecurringEventsComponent);

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary} from '../../Events';
import {EVENTS} from '../../../constants';
import {eventUtils, gettext} from '../../../utils';
import {Row} from '../../UI/Preview';
import '../style.scss';

export class AssignCalendarComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EVENTS.UPDATE_METHODS[0],
            relatedEvents: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            EVENTS.UPDATE_METHODS[0],
            true
        );

        this.setState({relatedEvents: event._events});

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
        });
    }

    submit() {
        // Send the required fields and calendar only
        return this.props.onSubmit(
            this.props.original,
            {
                ...this.props.updates,
                update_method: this.state.eventUpdateMethod,
            }
        );
    }

    render() {
        const {original, submitting} = this.props;
        const numEvents = this.state.relatedEvents.length + 1;

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

                <EventScheduleSummary schedule={original.dates} noPadding={true} />

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
    original: PropTypes.object.isRequired,
    updates: PropTypes.object.isRequired,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates) => (
        dispatch(actions.main.save(original, updates, false))
            .then((savedItem) => dispatch(actions.events.api.unlock(savedItem)))
    ),
    onHide: (event) => {
        dispatch(actions.events.api.unlock(event));
    },
});

export const AssignCalendarForm = connect(
    null,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(AssignCalendarComponent);

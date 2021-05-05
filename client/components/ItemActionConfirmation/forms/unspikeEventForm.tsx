import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as actions from '../../../actions';
import '../style.scss';
import {WORKFLOW_STATE, EVENTS} from '../../../constants';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary} from '../../Events';
import {eventUtils, gettext} from '../../../utils';
import {Row} from '../../UI/Preview';

export class UnspikeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventUpdateMethod: EVENTS.UPDATE_METHODS[0],
            relatedEvents: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        if (get(this.props, 'original.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(
                this.props.original,
                EVENTS.UPDATE_METHODS[0]
            );

            this.setState({relatedEvents: event._events});
        }

        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
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

    submit() {
        return this.props.onSubmit({
            ...this.props.original,
            update_method: this.state.eventUpdateMethod,
        });
    }

    render() {
        const {original, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;
        const numEvents = (this.state.relatedEvents.filter(
            (event) => get(event, 'state') === WORKFLOW_STATE.SPIKED)
        ).length + 1;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <EventScheduleSummary schedule={original.dates} />

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
                    action="spike"
                />
            </div>
        );
    }
}

UnspikeEventComponent.propTypes = {
    original: PropTypes.object.isRequired,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => (dispatch(actions.events.ui.unspike(event))),
});

export const UnspikeEventForm = connect(
    null,
    mapDispatchToProps,
    null,
    {forwardRef: true})(UnspikeEventComponent);

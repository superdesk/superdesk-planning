import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {get} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary, EventUpdateMethods} from '../../Events';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {eventUtils, gettext, isItemPublic} from '../../../utils';
import {Row} from '../../UI/Preview';
import '../style.scss';

export class PostEventsComponent extends React.Component {
    constructor(props) {
        super(props);
        const postAll = get(props.original, '_post', true) && !isItemPublic(props.original);

        this.state = {
            eventUpdateMethod: postAll ? EventUpdateMethods[2] : EventUpdateMethods[0],
            relatedEvents: [],
            relatedPlannings: [],
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentWillMount() {
        const isRecurring = get(this.props, 'original.recurrence_id');

        this.posting = get(this.props.original, '_post', true);

        if (isRecurring || eventUtils.eventHasPlanning(this.props.original)) {
            const event = isRecurring ?
                eventUtils.getRelatedEventsForRecurringEvent(
                    this.props.original,
                    EventUpdateMethods[2],
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
            {update_method: this.state.eventUpdateMethod}
        );
    }

    render() {
        const {original, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;
        const posting = get(original, '_post', true);
        const updateMethodLabel = posting ?
            gettext('Post all recurring events or just this one?') :
            gettext('Unpost all recurring events or just this one?');
        const postAll = posting && !isItemPublic(original);
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

                <EventScheduleSummary
                    schedule={original.dates}
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
                    showMethodSelection={isRecurring && !postAll}
                    updateMethodLabel={updateMethodLabel}
                    showSpace={false}
                    readOnly={submitting}
                    relatedPlannings={this.state.relatedPlannings}
                    relatedEvents={this.state.relatedEvents}
                    action={posting ? gettext('post') : gettext('unpost')} />
                {postAll && (
                    <div className="sd-alert sd-alert--hollow
                        sd-alert--alert sd-alert--flex-direction">
                        {gettext('This event is a recurring event. Post all recurring events')}
                    </div>
                )}
            </div>
        );
    }
}

PostEventsComponent.propTypes = {
    original: PropTypes.object.isRequired,
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
    onSubmit: (original, updates) => dispatch(original._post ?
        actions.main.post(original, updates, false) :
        actions.main.unpost(original, updates, false)
    )
        .then((updatedEvent) => {
            if (ownProps.resolve) {
                ownProps.resolve(updatedEvent);
            }

            return Promise.resolve(updatedEvent);
        }),
    onHide: () => {
        if (ownProps.resolve) {
            ownProps.resolve();
        }
    },
});

export const PostEventsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(PostEventsComponent);

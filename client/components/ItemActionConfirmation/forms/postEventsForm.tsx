import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {get} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EventScheduleSummary} from '../../Events';
import {EVENTS} from '../../../constants';
import {eventUtils, gettext, isItemPublic} from '../../../utils';
import {Row} from '../../UI/Preview';
import '../style.scss';

export class PostEventsComponent extends React.Component {
    constructor(props) {
        super(props);
        const postAll = get(props.original, '_post', true) && !isItemPublic(props.original);

        this.state = {
            eventUpdateMethod: postAll ? EVENTS.UPDATE_METHODS[2] : EVENTS.UPDATE_METHODS[0],
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
                    EVENTS.UPDATE_METHODS[2],
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
        const {original, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;
        const posting = get(original, '_post', true);
        const updateMethodLabel = posting ?
            gettext('Post all recurring events or just this one?') :
            gettext('Unpost all recurring events or just this one?');
        const postAll = posting && !isItemPublic(original);
        const numEvents = this.state.relatedEvents.length + 1;
        const planningItem = get(this.props, 'modalProps.planningItem');
        const msgTxt = planningItem ?
            gettext('This will also post the related event\'s entire recurring series') :
            gettext('This event is a recurring event. Post all recurring events');

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

                <EventScheduleSummary schedule={original} />

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
                    action={posting ? gettext('post') : gettext('unpost')}
                    originalEvent={planningItem ? original : null}
                />
                {postAll && (
                    <div className="sd-alert sd-alert--hollow sd-alert--alert sd-alert--flex-direction">
                        {msgTxt}
                    </div>
                )}
            </div>
        );
    }
}

PostEventsComponent.propTypes = {
    original: PropTypes.object.isRequired,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    resolve: PropTypes.func,
    modalProps: PropTypes.object,
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: (original, updates) => {
        let promise;

        if (get(ownProps, 'modalProps.planningAction')) {
            promise = dispatch(ownProps.modalProps.planningAction(ownProps.modalProps.planningItem, updates));
        } else {
            promise = dispatch(original._post ? actions.main.post(original, updates, false) :
                actions.main.unpost(original, updates, false));
        }

        return promise.then((updatedItem) => {
            if (ownProps.resolve) {
                ownProps.resolve(updatedItem);
            }

            return Promise.resolve(updatedItem);
        });
    },
    onHide: () => {
        if (ownProps.resolve) {
            ownProps.resolve();
        }
    },
});

export const PostEventsForm = connect(
    null,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(PostEventsComponent);

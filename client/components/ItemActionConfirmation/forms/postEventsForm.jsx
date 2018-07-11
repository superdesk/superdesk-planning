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
        const postAll = get(props.initialValues, '_post', true) && !isItemPublic(props.initialValues);

        this.state = {
            eventUpdateMethod: postAll ? EventUpdateMethods[2] : EventUpdateMethods[0],
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
        return this.props.onSubmit({
            ...this.props.initialValues,
            update_method: this.state.eventUpdateMethod,
        });
    }

    render() {
        const {initialValues, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const posting = get(initialValues, '_post', true);
        const updateMethodLabel = posting ?
            gettext('Post all recurring events or just this one?') :
            gettext('Unpost all recurring events or just this one?');
        const postAll = posting && !isItemPublic(initialValues);
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
                    showMethodSelection={isRecurring && !postAll}
                    updateMethodLabel={updateMethodLabel}
                    showSpace={false}
                    readOnly={submitting}
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
    onSubmit: (event) => dispatch(event._post ?
        actions.main.post(event, false) :
        actions.main.unpost(event, false)
    ),
});

export const PostEventsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(PostEventsComponent);

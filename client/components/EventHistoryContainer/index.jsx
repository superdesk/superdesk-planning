import React from 'react';
import PropTypes from 'prop-types';
import {EventHistoryList} from '../../components';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';

class EventHistoryComponent extends React.Component {
    render() {
        const {eventHistoryItems, users, openPlanningClick, openEventPreview, closeEventHistory} = this.props;

        return (
            <div>
                <EventHistoryList
                    eventHistoryItems={eventHistoryItems}
                    users={users}
                    openPlanningClick={openPlanningClick}
                    openEventPreview={openEventPreview}
                    closeEventHistory={closeEventHistory} />
            </div>
        );
    }

    componentWillMount() {
        this.props.fetchEventHistory(this.props.highlightedEvent);
    }
}

EventHistoryComponent.propTypes = {
    eventHistoryItems: PropTypes.array,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    highlightedEvent: PropTypes.string,
    fetchEventHistory: PropTypes.func,
    openPlanningClick: PropTypes.func,
    closeEventHistory: PropTypes.func,
    openEventPreview: PropTypes.func,
};

const mapStateToProps = (state) => ({
    eventHistoryItems: selectors.getEventHistory(state),
    users: selectors.getUsers(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventHistory: (highlightedEvent) => (
        dispatch(actions.events.api.fetchEventHistory(highlightedEvent))
    ),
    openPlanningClick: (planningId) => (
        dispatch(actions.planning.ui.previewPlanningAndOpenAgenda(planningId))
    ),
    openEventPreview: (eventId) => {
        dispatch(actions.events.ui.closeEventDetails());
        dispatch(actions.events.ui.previewEvent({_id: eventId}));
    },
});

export const EventHistoryContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventHistoryComponent);

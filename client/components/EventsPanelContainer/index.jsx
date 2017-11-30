import React from 'react';
import {ResizableEventsPanel, EventsListContainer, EventForm} from '../index';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import './style.scss';

const DEFAULT_FORM_VALUES = {
    occur_status: {
        name: 'Planned, occurs certainly',
        qcode: 'eocstat:eos5',
    },
};

export const EventsPanel = ({eventToDetail, handleBackToList}) => (
    <ResizableEventsPanel className="Events-panel" minWidth={570}>
        {eventToDetail &&
            <EventForm initialValues={eventToDetail} onBackClick={handleBackToList.bind(null, eventToDetail)} />
        }
        {!eventToDetail &&
            <EventsListContainer/>
        }
    </ResizableEventsPanel>
);

EventsPanel.propTypes = {
    eventToDetail: React.PropTypes.object,
    handleBackToList: React.PropTypes.func,
};

const mapStateToProps = (state) => ({
    // selectors.getShowEventDetails is either true, an event id, or null
    eventToDetail: selectors.getShowEventDetails(state) === true
        ? {occur_status: state.vocabularies.eventoccurstatus.find((u) => u.qcode === DEFAULT_FORM_VALUES.occur_status.qcode)}
        : selectors.getEventToBeDetailed(state),
});

const mapDispatchToProps = (dispatch) => (
    {handleBackToList: (event) => (dispatch(actions.events.ui.closeEventDetails(event)))}
);

export const EventsPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsPanel);

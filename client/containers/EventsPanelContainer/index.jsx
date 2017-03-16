import React from 'react'
import { EventsListContainer, EventForm } from '../index'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import './style.scss'

export const EventsPanel = ({ eventToDetail, handleBackToList }) => (
    <div className="Planning__events-panel">
        {eventToDetail &&
            <EventForm initialValues={eventToDetail} onBackClick={handleBackToList} />
        }
        {!eventToDetail &&
            <EventsListContainer/>
        }
    </div>
)

EventsPanel.propTypes = {
    eventToDetail: React.PropTypes.object,
    handleBackToList: React.PropTypes.func,
}

const mapStateToProps = (state) => ({
    // selectors.getShowEventDetails is either true, an event id, or null
    eventToDetail: selectors.getShowEventDetails(state) === true
        ? {}
        : selectors.getEventToDetail(state),
})

const mapDispatchToProps = (dispatch) => ({
    handleBackToList: () => (dispatch(actions.closeEventDetails()))
})

export const EventsPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsPanel)

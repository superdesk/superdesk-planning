import React from 'react'
import PropTypes from 'prop-types'
import { EventHistoryList } from '../../components'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'

class EventHistoryComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { eventHistoryItems, users, openPlanningClick } = this.props
        return (
            <div>
                <EventHistoryList eventHistoryItems={eventHistoryItems} users={users} openPlanningClick={openPlanningClick} />
            </div>
        )
    }

    componentWillMount() {
        this.props.fetchEventHistory(this.props.highlightedEvent)
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
}

const mapStateToProps = (state) => ({
    eventHistoryItems: selectors.getEventHistory(state),
    users: selectors.getUsers(state),
})

const mapDispatchToProps = (dispatch) => ({
    fetchEventHistory: (highlightedEvent) => (
        dispatch(actions.fetchEventHistory(highlightedEvent))
    ),
    openPlanningClick: (planningId) => (
        dispatch(actions.previewPlanningAndOpenAgenda(planningId))
    ),
})

export const EventHistoryContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventHistoryComponent)

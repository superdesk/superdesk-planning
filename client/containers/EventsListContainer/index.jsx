import React from 'react'
import { EventsList, SearchBar } from '../../components'
import { AdvancedSearchPanelContainer } from '../index'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { get } from 'lodash'
import './style.scss'

class EventsListComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        // load events for the first time
        this.props.loadEvents(this.props.currentSearch && this.props.currentSearch.fulltext)
    }

    toggleAdvancedSearch() {
        if (this.props.advancedSearchOpened) {
            this.props.closeAdvancedSearch()
        } else {
            this.props.openAdvancedSearch()
        }
    }

    render() {
        const { advancedSearchOpened, toggleEventsList, loadEvents, currentSearch } = this.props
        const classes = [
            'Events-list-container',
            advancedSearchOpened ? 'Events-list-container--advanced-search-view' : null,
        ]
        return (
            <div className={classes.join(' ')}>
                <div className="Events-list-container__header subnav">
                    <div className="subnav__button-stack--square-buttons">
                        <div className="navbtn" title="Hide the list">
                            <button onClick={toggleEventsList} type="button">
                                <i className="icon-chevron-left-thin"/>
                            </button>
                        </div>
                    </div>
                    <h3 className="subnav__page-title">
                        <span>
                            <span>Events calendar</span>
                        </span>
                    </h3>
                </div>
                <div className="Events-list-container__search subnav">
                    <label
                        className="trigger-icon advanced-search-open"
                        onClick={this.toggleAdvancedSearch.bind(this)}>
                        <i className="icon-filter-large" />
                    </label>
                    <SearchBar value={get(currentSearch, 'fulltext')} onSearch={(value) => loadEvents(value)}/>
                    <button className="btn btn--primary"
                            onClick={this.props.openEventDetails.bind(null, null)}>
                        Add event
                    </button>
                </div>
                <div className="Events-list-container__body">
                    <AdvancedSearchPanelContainer  />
                    <EventsList events={this.props.events}
                                onEventClick={this.props.openEventDetails}
                                onEventDelete={this.props.deleteEvent}
                                selectedEvent={this.props.selectedEvent} />
                </div>
            </div>
        )
    }
}

EventsListComponent.propTypes = {
    openEventDetails: React.PropTypes.func,
    loadEvents: React.PropTypes.func,
    events: React.PropTypes.array,
    currentSearch: React.PropTypes.object,
    advancedSearchOpened: React.PropTypes.bool,
    openAdvancedSearch: React.PropTypes.func.isRequired,
    closeAdvancedSearch: React.PropTypes.func.isRequired,
    toggleEventsList: React.PropTypes.func,
    deleteEvent: React.PropTypes.func,
    selectedEvent: React.PropTypes.string,
}

const mapStateToProps = (state) => ({
    events: selectors.getEventsWithMoreInfo(state),
    currentSearch: get(state, 'events.search.currentSearch'),
    advancedSearchOpened: get(state, 'events.search.advancedSearchOpened'),
    selectedEvent: selectors.getSelectedEvent(state),
})

const mapDispatchToProps = (dispatch) => ({
    openEventDetails: (event) => dispatch(actions.openEventDetails(event)),
    loadEvents: (keyword) => dispatch(actions.fetchEvents({ fulltext: keyword })),
    openAdvancedSearch: () => (dispatch(actions.openAdvancedSearch())),
    closeAdvancedSearch: () => (dispatch(actions.closeAdvancedSearch())),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
    deleteEvent: (event) => dispatch(actions.openDeleteEvent(event)),
})

export const EventsListContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsListComponent)

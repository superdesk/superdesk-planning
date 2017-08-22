import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {
    AdvancedSearchPanelContainer,
    EventsList,
    SearchBar,
    MultiEventsSelectionActions,
} from '../index'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { ADVANCED_SEARCH_CONTEXT } from '../../constants'
import { get } from 'lodash'
import './style.scss'

class EventsListComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    toggleAdvancedSearch() {
        if (this.props.advancedSearchOpened) {
            this.props.closeAdvancedSearch()
        } else {
            this.props.openAdvancedSearch()
        }
    }

    render() {
        const {
            advancedSearchOpened,
            toggleEventsList,
            loadEvents,
            currentSearch,
            privileges,
            session,
            onCancelEvent,
            addEventToCurrentAgenda,
        } = this.props
        return (
            <div className={classNames('Events-list-container',
                { 'Events-list-container--advanced-search-view': advancedSearchOpened })}>
                <div className="Events-list-container__header subnav">
                    <div className="subnav__button-stack--square-buttons">
                        <div className="navbtn" title="Hide the list">
                            <button onClick={toggleEventsList} type="button" className="backlink" />
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
                        <i className={classNames('icon-filter-large',
                            { 'icon--blue': get(currentSearch, 'advancedSearch') })} />
                    </label>
                    <SearchBar value={get(currentSearch, 'fulltext')} onSearch={(value) => loadEvents(value)}/>
                    {privileges.planning_event_management === 1 && (
                        <button className="btn btn--primary"
                                onClick={this.props.openEventDetails.bind(null, null)}>
                            Add event
                        </button>
                    )}
                </div>
                {this.props.selectedEvents.length > 0 &&
                    <div className="Events-list-container__selection subnav">
                        <MultiEventsSelectionActions/>
                    </div>
                }
                <div className="Events-list-container__body">
                    <AdvancedSearchPanelContainer searchContext={ADVANCED_SEARCH_CONTEXT.EVENT}/>
                    <EventsList events={this.props.events}
                                onClick={this.props.previewEvent}
                                onDoubleClick={this.props.openEventDetails}
                                onEventSpike={this.props.spikeEvent}
                                onEventUnspike={this.props.unspikeEvent}
                                onEventDuplicate={this.props.duplicateEvent}
                                onCancelEvent={onCancelEvent}
                                highlightedEvent={this.props.highlightedEvent}
                                loadMoreEvents={this.props.loadMoreEvents}
                                selectedEvents={this.props.selectedEvents}
                                onEventSelectChange={this.props.onEventSelectChange}
                                privileges={privileges}
                                addEventToCurrentAgenda={addEventToCurrentAgenda}
                                session={session} />
                </div>
            </div>
        )
    }
}

EventsListComponent.propTypes = {
    openEventDetails: PropTypes.func,
    previewEvent: PropTypes.func,
    loadEvents: PropTypes.func,
    events: PropTypes.array,
    currentSearch: PropTypes.object,
    advancedSearchOpened: PropTypes.bool,
    openAdvancedSearch: PropTypes.func.isRequired,
    closeAdvancedSearch: PropTypes.func.isRequired,
    toggleEventsList: PropTypes.func,
    spikeEvent: PropTypes.func,
    unspikeEvent: PropTypes.func,
    duplicateEvent: PropTypes.func,
    highlightedEvent: PropTypes.string,
    privileges: PropTypes.object.isRequired,
    loadMoreEvents: PropTypes.func.isRequired,
    selectedEvents: PropTypes.array.isRequired,
    onEventSelectChange: PropTypes.func.isRequired,
    session: PropTypes.object,
    onCancelEvent: PropTypes.func,
    addEventToCurrentAgenda: PropTypes.func,
}

const mapStateToProps = (state) => ({
    events: selectors.getEventsOrderedByDay(state),
    currentSearch: get(state, 'events.search.currentSearch'),
    advancedSearchOpened: get(state, 'events.search.advancedSearchOpened'),
    highlightedEvent: selectors.getHighlightedEvent(state),
    privileges: selectors.getPrivileges(state),
    selectedEvents: selectors.getSelectedEvents(state),
    session: selectors.getSessionDetails(state),
})

const mapDispatchToProps = (dispatch) => ({
    openEventDetails: (event) => dispatch(actions.events.ui.openEventDetails(event)),
    previewEvent: (event) => dispatch(actions.events.ui.previewEvent(event)),
    loadEvents: (keyword) => dispatch(actions.fetchEvents({ fulltext: keyword })),
    openAdvancedSearch: () => (dispatch(actions.events.ui.openAdvancedSearch())),
    closeAdvancedSearch: () => (dispatch(actions.events.ui.closeAdvancedSearch())),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
    loadMoreEvents: () => (dispatch(actions.loadMoreEvents())),
    spikeEvent: (event) => dispatch(actions.events.ui.openSpikeModal(event)),
    unspikeEvent: (event) => dispatch(actions.events.ui.openUnspikeModal(event)),
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
    onEventSelectChange: (args) => dispatch(actions.toggleEventSelection(args)),

    onCancelEvent: (event) => dispatch(actions.events.ui.openCancelModal(event)),
    addEventToCurrentAgenda: (event) => dispatch(actions.addEventToCurrentAgenda(event)),
})

export const EventsListContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsListComponent)

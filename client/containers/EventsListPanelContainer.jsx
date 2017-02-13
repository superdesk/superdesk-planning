import React from 'react'
import { EventsList, AdvancedSearchPanel } from '../components'
import { connect } from 'react-redux'
import * as actions from '../actions'
import * as selectors from '../selectors'
import DebounceInput from 'react-debounce-input'
import { isNil } from 'lodash'

class EventsListPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // initialize state from props
            searchBarExtended: !isNil(props.initialFilterKeyword),
            advancedSearchExtended: !isNil(props.initialAdvancedSearchExtended),
            // initialFilterKeyword is not intended to change
            searchInputValue: props.initialFilterKeyword
        }
    }

    componentWillMount() {
        // load events for the first time
        this.props.loadEvents(this.props.initialFilterKeyword)
    }

    toggleSearchBar() {
        this.setState({ searchBarExtended: !this.state.searchBarExtended })
    }

    /** Reset the field value, close the search bar and load events */
    resetSearch() {
        this.setState({ searchBarExtended: false, searchInputValue: '' })
        this.props.loadEvents()
    }

    /** Open advanced search filter dialog */
    toggleAdvancedSearch() {
        this.setState({ advancedSearchExtended: !this.state.advancedSearchExtended })
    }

    /** Search events by keywords */
    onSearchChange(event) {
        this.props.loadEvents(event.target.value)
        // update the input value since we are using the DebounceInput `value` prop
        this.setState({ searchInputValue: event.target.value })
    }

    render() {
        const { searchBarExtended } = this.state
        const { advancedSearchExtended } = this.state
        return (
            <div className="Planning__events-list">
                <AdvancedSearchPanel 
                    className={(advancedSearchExtended ? ' extended': '')} />
                <div className="subnav">
                    <div className={'flat-searchbar' + (searchBarExtended ? ' extended' : '')}>
                        <div className="search-handler">
                            <label
                                className="trigger-icon advanced-search-open"
                                onClick={this.toggleAdvancedSearch.bind(this)}>
                                <i className="icon-filter-large" />
                            </label>
                            <label
                                htmlFor="search-input"
                                className="trigger-icon"
                                onClick={this.toggleSearchBar.bind(this)}>
                                <i className="icon-search" />
                            </label>
                            <DebounceInput
                                minLength={2}
                                debounceTimeout={500}
                                value={this.state.searchInputValue}
                                onChange={this.onSearchChange.bind(this)}
                                id="search-input"
                                placeholder="Search"
                                type="text"/>
                            <button
                                className="search-close visible"
                                onClick={this.resetSearch.bind(this)}>
                                <i className="icon-remove-sign" />
                            </button>
                            <button className="search-close">
                                <i className="svg-icon-right" />
                            </button>
                        </div>
                    </div>
                    <h3 className="subnav__page-title">
                        <span>
                            <span>Events calendar</span>
                        </span>
                    </h3>
                    <div className="subnav__button-stack--square-buttons">
                        <div className="refresh-box pull-right" />
                        <div className="navbtn" title="Create">
                            <button className="sd-create-btn"
                                    onClick={this.props.openAddEvent.bind(null, null)}>
                                <i className="svg-icon-plus" />
                                <span className="circle" />
                            </button>
                        </div>
                    </div>
                </div>
                <EventsList events={this.props.events}
                            onAddToAgendaClick={this.props.onAddToAgendaClick}
                            onEventClick={this.props.openAddEvent} />
            </div>
        )
    }
}

EventsListPanel.propTypes = {
    openAddEvent: React.PropTypes.func,
    loadEvents: React.PropTypes.func,
    events: React.PropTypes.array,
    initialAdvancedSearchExtended: React.PropTypes.bool,
    initialFilterKeyword: React.PropTypes.array,
    initialFilterStartDate: React.PropTypes.string,
    initialFilterEndDate: React.PropTypes.string,
    onAddToAgendaClick: React.PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
    events: selectors.getEvents(state),
    initialAdvancedSearchExtended: state.events.initialAdvancedSearchExtended,
    initialFilterKeyword: state.events.initialFilterKeyword,
    initialFilterStartDate: state.events.initialFilterStartDate,
    initialFilterEndDate: state.events.initialFilterEndDate,
})

const mapDispatchToProps = (dispatch) => ({
    openAddEvent: (event) => dispatch(actions.showModal({
        modalType: 'EDIT_EVENT',
        modalProps: { event: event }
    })),
    loadEvents: (keyword) => dispatch(actions.fetchEvents({keyword})),
    onAddToAgendaClick: (event) => dispatch(actions.addEventToCurrentAgenda(event))
})

export const EventsListPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsListPanel)

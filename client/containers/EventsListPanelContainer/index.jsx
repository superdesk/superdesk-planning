import React from 'react'
import { EventsList } from '../../components'
import { AdvancedSearchPanelContainer } from '../index'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import DebounceInput from 'react-debounce-input'
import { isNil, get } from 'lodash'
import './style.scss'

class EventsListPanel extends React.Component {
    constructor(props) {
        super(props)
        const currentKeyword = get(props, 'currentSearch.fulltext')
        this.state = {
            // initialize state from props
            searchBarExtended: !isNil(currentKeyword),
            searchInputValue: currentKeyword,
        }
    }

    componentWillMount() {
        // load events for the first time
        this.props.loadEvents(this.props.currentSearch && this.props.currentSearch.fulltext)
    }

    toggleSearchBar() {
        this.setState({ searchBarExtended: !this.state.searchBarExtended })
    }

    /** Reset the field value, close the search bar and load events */
    resetSearch() {
        this.setState({ searchBarExtended: false, searchInputValue: '' })
        this.props.loadEvents()
    }

    /** Search events by keywords */
    onSearchChange(event) {
        this.setState(
            { searchInputValue: event.target.value },
            // update the input value since we are using the DebounceInput `value` prop
            () => this.props.loadEvents(event.target.value)
        )
    }

    toggleAdvancedSearch() {
        if (this.props.advancedSearchOpened) {
            this.props.closeAdvancedSearch()
        } else {
            this.props.openAdvancedSearch()
        }
    }

    render() {
        const { searchBarExtended } = this.state
        const { advancedSearchOpened } = this.props
        const classes = [
            'Planning__events-list-container',
            advancedSearchOpened ? 'Planning--advanced-search-view' : null
        ]
        return (
            <div className={classes.join(' ')}>
                <div className="Planning__events-list">
                    <AdvancedSearchPanelContainer  />
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
                        <button className="btn btn--primary"
                                onClick={this.props.openAddEvent.bind(null, null)}>
                            Add an event
                        </button>
                    </div>
                    <EventsList events={this.props.events}
                                onEventClick={this.props.openAddEvent} />
                </div>
            </div>
        )
    }
}

EventsListPanel.propTypes = {
    openAddEvent: React.PropTypes.func,
    loadEvents: React.PropTypes.func,
    events: React.PropTypes.array,
    currentSearch: React.PropTypes.string,
    advancedSearchOpened: React.PropTypes.bool,
    openAdvancedSearch: React.PropTypes.func.isRequired,
    closeAdvancedSearch: React.PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
    events: selectors.getEventsWithMoreInfo(state),
    currentSearch: state.events.search.currentSearch,
    advancedSearchOpened: state.events.search.advancedSearchOpened
})

const mapDispatchToProps = (dispatch) => ({
    openAddEvent: (event) => dispatch(actions.showModal({
        modalType: 'EDIT_EVENT',
        modalProps: { event: event }
    })),
    loadEvents: (keyword) => dispatch(actions.fetchEvents({ fulltext: keyword })),
    openAdvancedSearch: () => (dispatch(actions.openAdvancedSearch())),
    closeAdvancedSearch: () => (dispatch(actions.closeAdvancedSearch()))
})

export const EventsListPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsListPanel)

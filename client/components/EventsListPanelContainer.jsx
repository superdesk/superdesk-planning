import React from 'react'
import { EventsList } from './index'
import { connect } from 'react-redux'
import * as actions from '../actions'
import DebounceInput from 'react-debounce-input'

class EventsListPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            searchBarExtended: false
        }
    }

    componentWillMount() {
        this.props.loadEvents()
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
        this.props.loadEvents(event.target.value)
        // update the input value since we are using the DebounceInput `value` prop
        this.setState({ searchInputValue: event.target.value })
    }

    render() {
        const { searchBarExtended } = this.state
        return (
            <div className="Planning__events-list">
                <div className="subnav">
                    <div className={'flat-searchbar' + (searchBarExtended ? ' extended' : '')}>
                        <div className="search-handler">
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
                            onEventClick={this.props.openAddEvent} />
            </div>
        )
    }
}

EventsListPanel.propTypes = {
    openAddEvent: React.PropTypes.func,
    loadEvents: React.PropTypes.func,
    events: React.PropTypes.array,
}

const mapStateToProps = (state) => ({ events: state.events })

const mapDispatchToProps = (dispatch) => ({
    openAddEvent: (event) => dispatch(actions.showModal({
        modalType: 'EDIT_EVENT',
        modalProps: { event: event }
    })),
    loadEvents: (query) => dispatch(actions.fetchEvents(query)),
})

export const EventsListPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsListPanel)

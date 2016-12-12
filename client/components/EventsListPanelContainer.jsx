import React from 'react'
import { EventsList } from './index'
import { connect } from 'react-redux'
import * as actions from '../actions'

class EventsListPanel extends React.Component {
    componentWillMount() {
        this.props.loadEvents()
    }

    render() {
        return (
            <div className="Planning__events-list">
                <div className="subnav">
                    <div className="flat-searchbar monitoring-flat-searchbar">
                        <div className="search-handler">
                            <label htmlFor="search-input" className="trigger-icon">
                                <i className="icon-search" />
                            </label>
                            <input id="search-input" placeholder="Search" type="text"/>
                            <button className="search-close" >
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
    loadEvents: () => dispatch(actions.fetchEvents())
})

export const EventsListPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventsListPanel)

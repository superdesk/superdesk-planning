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
                                <i className="icon-search"></i>
                            </label>
                            <input id="search-input" placeholder="Search" type="text"/>
                            <button className="search-close" >
                                <i className="icon-remove-sign"></i>
                            </button>
                            <button className="search-close">
                                <i className="svg-icon-right"></i>
                            </button>
                        </div>
                    </div>
                    <h3 className="subnav__page-title">
                        <span>
                            <span>Events calendar</span>
                        </span>
                    </h3>
                    <div className="subnav__button-stack--square-buttons">
                        <div className="refresh-box pull-right"></div>
                        <div className="navbtn" title="Create">
                            <button className="sd-create-btn"
                                    onClick={this.props.openAddEvent.bind(null, null)}>
                                <i className="svg-icon-plus"></i>
                                <span className="circle"></span>
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

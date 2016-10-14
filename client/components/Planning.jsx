import React from 'react';
import { EventsList, AddEventModal } from './index';

export class Planning extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            openAddEvent: false,
            events: [] // init events. We actually load them just below
        };
        // load and show the events list
        this.loadEvents();
    }

    // REDUCERS (update the state)

    /** Load the events from API and display them */
    loadEvents() {
        return this.props.api('events')
        .query()
        .then((e) => this.setState({ events: e._items }));
    }

    /** open the modal to add/edit an event */
    openAddEvent(event) { this.setState({ openAddEvent: Object.assign({}, event) }); }

    /** close the add/edit an event modal */
    closeAddEvent() { this.setState({ openAddEvent: false }); }

    onAddEventModalSave(newEvent) {
        // clone the events
        let events = this.state.events.slice();
        // find the old event to be replaced by the new one
        let oldEvent = events.find((e) => e._id === newEvent._id);
        if (oldEvent) {
            let index = events.indexOf(oldEvent);
            // replace the old event by the new one
            events.splice(index, 1, newEvent);
            // update the state (and render)
            this.setState({ events });
        } else {
            // if there is no old event to replace, let's reload the list
            this.loadEvents();
        }
        // close the modal
        this.closeAddEvent();
    }

    render() {
        return (
            <div>
                <AddEventModal {...this.props}
                               show={this.state.openAddEvent}
                               onSave={this.onAddEventModalSave.bind(this)}
                               onHide={this.closeAddEvent.bind(this)}/>
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
                                        onClick={this.openAddEvent.bind(this)}>
                                    <i className="svg-icon-plus"></i>
                                    <span className="circle"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <EventsList events={this.state.events}
                                onEventClick={this.openAddEvent.bind(this)} />
                </div>
                <div className="Planning__coverage">
                    <header></header>
                </div>
            </div>
        );
    }
}

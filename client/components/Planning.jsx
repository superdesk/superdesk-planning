import React from 'react';
import { EventsList, AddEventModal } from './index';

export class Planning extends React.Component {

    constructor(props) {
        super(props);
        var self = this;
        this.state = {
            openAddEvent: false,
            events: [] // init events. We actually load them just below
        };
        props.api('events').query().then(function(e) {
            self.setState({ events: e._items });
        });
    }

    openAddEvent(event) { this.setState({ openAddEvent: event }); }

    closeAddEvent() { this.setState({ openAddEvent: false }); }

    render() {
        return (
            <div>
                <AddEventModal {...this.props}
                               show={this.state.openAddEvent}
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

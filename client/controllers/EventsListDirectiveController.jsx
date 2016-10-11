import React from 'react';
import ReactDOM from 'react-dom';
import { EventsList } from '../components';

EventsListDirectiveController.$inject = ['$element', 'api'];
export function EventsListDirectiveController($element, api) {
    let events;
    api('events').query().then(function(e) {
        events = e._items;
        ReactDOM.render(<EventsList events={events} />, $element.get(0));
    });

}

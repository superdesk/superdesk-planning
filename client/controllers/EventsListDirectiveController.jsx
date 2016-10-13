import React from 'react';
import ReactDOM from 'react-dom';
import { EventsList } from '../components';

EventsListDirectiveController.$inject = ['$element', 'api', 'addEventForm'];
export function EventsListDirectiveController($element, api, addEventForm) {
    let events;
    api('events').query().then(function(e) {
        events = e._items;
        ReactDOM.render(<EventsList addEventFormService={addEventForm}
                                    events={events}/>, $element.get(0));
    });

}

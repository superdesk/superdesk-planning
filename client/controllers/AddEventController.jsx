import React from 'react';
import ReactDOM from 'react-dom';
import { AddEventForm } from '../components';

AddEventController.$inject = ['$element', 'api'];
export function AddEventController($element, api) {
    let eventsResource = api('events');
    ReactDOM.render(<AddEventForm eventsResource={eventsResource} />, $element.get(0));
}

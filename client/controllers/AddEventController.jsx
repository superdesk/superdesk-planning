import React from 'react';
import ReactDOM from 'react-dom';
import { AddEventForm } from '../components';

AddEventController.$inject = ['$element', 'api'];
export function AddEventController($element, api) {
    let vm = this;
    let eventsResource = api('events');
    ReactDOM.render(<AddEventForm eventsResource={eventsResource}
                                  event={vm.event} />, $element.get(0));
}

import React from 'react';
import ReactDOM from 'react-dom';
import { AddEventForm } from '../components';

AddEventController.$inject = ['$element'];
export function AddEventController($element) {
    ReactDOM.render(<AddEventForm />, $element.get(0));
}

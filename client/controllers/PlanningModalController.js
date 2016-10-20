import React from 'react';
import ReactDOM from 'react-dom';
import { Planning } from '../components';

PlanningModalController.$inject = ['$element', 'api'];
export function PlanningModalController($element, api) {
    ReactDOM.render(<Planning api={api} />, $element.get(0));
}

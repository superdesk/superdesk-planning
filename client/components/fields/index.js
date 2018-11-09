import React from 'react';

import {name} from './name';
import {slugline} from './slugline';
import {headline} from './headline';
import {description} from './description';
import {internalnote} from './internalnote';
import {state} from './state';
import {actionedState} from './actionedState';
import {calendars} from './calendars';
import {location} from './location';
import {files} from './files';

let registeredFields = {};

/**
 * Register field for rendering
 * @param {String} id
 * @param {Element} component
 */
export function registerField(id, component) {
    registeredFields[id] = component;
}

/**
 * Render list of fields for given item
 * @param {Array} fields
 * @param {Object} item
 */
export function renderFields(fields, item, props) {
    return (Array.isArray(fields) ? fields : [fields]).map((id) => {
        const Component = registeredFields[id];

        if (Component) {
            return <Component key={id} item={item} {...props} />;
        }

        return null;
    });
}

// populate core fields
registerField('name', name);
registerField('slugline', slugline);
registerField('headline', headline);
registerField('description', description);
registerField('internalnote', internalnote);
registerField('state', state);

// Event related fields
registerField('actionedState', actionedState);
registerField('calendars', calendars);
registerField('location', location);
registerField('files', files);

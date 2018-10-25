import React from 'react';

import {name} from './name';
import {slugline} from './slugline';
import {headline} from './headline';
import {description} from './description';
import {internalnote} from './internalnote';

const registeredFields = {};

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
export function renderFields(fields, item) {
    return fields.map((id) => {
        const Component = registeredFields[id];

        if (Component) {
            return <Component key={id} item={item} />;
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

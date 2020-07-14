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
import {FeatureLabel} from '../Planning/FeaturedPlanning/index';
import {agendas} from './agendas';
import {coverages} from './coverages';
import {reference} from './reference';

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
 * @param {Array|String} fields
 * @param {Object} item
 * @param {Object} props
 */
export function renderFields(fields, item, props = {}) {
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
registerField('definition_short', description);
registerField('internalnote', internalnote);
registerField('state', state);

// Event related fields
registerField('actionedState', actionedState);
registerField('calendars', calendars);
registerField('location', location);
registerField('files', files);
registerField('featured', FeatureLabel);
registerField('agendas', agendas);
registerField('coverages', coverages);
registerField('reference', reference);

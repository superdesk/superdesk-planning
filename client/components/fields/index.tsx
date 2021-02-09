import React from 'react';
import {sortBy} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IRenderPanelType, ISearchProfile} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

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
import {FeatureLabel} from '../Planning/FeaturedPlanning';
import {agendas} from './agendas';
import {coverages} from './coverages';
import {reference} from './reference';

import {FIELD_TO_EDITOR_COMPONENT} from './editor';
import {FIELD_TO_LIST_COMPONENT} from './list';
import {FIELD_TO_PREVIEW_COMPONENT} from './preview/SimpleList';
import {FIELD_TO_FORM_PREVIEW_COMPONENT} from './preview/Form';
import {ToggleBox} from '../UI/ToggleBox';

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
    const language = getUserInterfaceLanguage();

    return (Array.isArray(fields) ? fields : [fields]).map((id) => {
        const Component = registeredFields[id];

        if (Component) {
            return (
                <Component
                    key={id}
                    item={item}
                    language={language}
                    {...props}
                />
            );
        }

        return null;
    });
}

function getFieldsForPanel(panelType: IRenderPanelType) {
    switch (panelType) {
    case 'editor':
        return FIELD_TO_EDITOR_COMPONENT;
    case 'list':
        return FIELD_TO_LIST_COMPONENT;
    case 'simple-preview':
        return FIELD_TO_PREVIEW_COMPONENT;
    case 'form-preview':
        return FIELD_TO_FORM_PREVIEW_COMPONENT;
    }
}

interface IRenderFieldItem {
    component: React.ComponentClass;
    props: {[key: string]: any};
    index: number;
    enabled: boolean;
    name: string;
    group?: string;
}

export function renderFieldsForPanel(
    panelType: IRenderPanelType,
    profile: ISearchProfile,
    globalProps: {[key: string]: any},
    fieldProps: {[key: string]: any},
    Container?: React.ComponentClass,
    groupName?: string,
    enabledField: string = 'enabled'
) {
    const fieldComponents = getFieldsForPanel(panelType);
    const fields: {[key: string]: IRenderFieldItem} = {};

    Object.keys(profile).forEach((fieldName) => {
        const newField: IRenderFieldItem = {
            component: fieldComponents[fieldName],
            props: {
                ...globalProps,
                testId: `field-${fieldName}`,
                ...fieldProps[fieldName],
            },
            name: fieldName,
            ...profile[fieldName],
        };

        if (newField.component == null) {
            console.error(`Component for field ${fieldName} not registered`);
        } else if (profile[fieldName].enabled &&
            profile[fieldName][enabledField] &&
            (!groupName || newField.group === groupName)
        ) {
            newField.enabled = true;
            fields[fieldName] = newField;
        }
    });

    const fieldsToRender = sortBy(fields, 'index');

    if (fieldsToRender.length > 0) {
        return fieldsToRender.map((field, index) => {
            const RenderComponent = field.component;

            return Container != null ? (
                <Container key={`${field.name}-${index}`}>
                    <RenderComponent {...field.props} />
                </Container>
            ) : (
                <RenderComponent
                    key={`${field.name}-${index}`}
                    {...field.props}
                />
            );
        });
    }

    return null;
}

export function renderGroupedFieldsForPanel(
    panelType: IRenderPanelType,
    profile: ISearchProfile,
    globalProps: {[key: string]: any},
    fieldProps: {[key: string]: any},
    Container?: React.ComponentClass,
    enabledField: string = 'enabled'
) {
    const {gettext} = superdeskApi.localization;

    const groups = [{
        name: 'common',
        title: gettext('Common'),
    }, {
        name: 'vocabularies',
        title: gettext('Vocabularies'),
    }, {
        name: 'states',
        title: gettext('Workflow States'),
    }, {
        name: 'dates',
        title: gettext('Dates'),
    }, {
        name: 'events',
        title: gettext('Events'),
    }, {
        name: 'planning',
        title: gettext('Planning'),
    }];

    return groups.map((group) => {
        const renderedFields = renderFieldsForPanel(
            panelType,
            profile,
            globalProps,
            fieldProps,
            Container,
            group.name,
            enabledField
        );

        if (renderedFields != null) {
            return (
                <ToggleBox
                    key={group.name}
                    isOpen={false}
                    title={group.title}
                    testId={`toggle-${group.name}`}
                >
                    {renderedFields}
                </ToggleBox>
            );
        }

        return null;
    })
        .filter((group) => group != null);
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

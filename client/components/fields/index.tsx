import React from 'react';
import {sortBy} from 'lodash';

import {IEventOrPlanningItem, IProfileSchema, IRenderPanelType, ISearchProfile, PREVIEW_PANEL} from '../../interfaces';
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

import {FIELD_TO_PREVIEW_COMPONENT, FIELD_TO_FORM_PREVIEW_COMPONENT} from './preview';

import {ToggleBox} from '../UI/ToggleBox';
import './style.scss';

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
 * @param {IEventOrPlanningItem} item
 * @param {Object} props
 */
export function renderFields(
    fields: Array<any>|string,
    item: IEventOrPlanningItem,
    props: Object = {},
    language: string = ''
) {
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

/**
 * Get translated field value based on language
 * @param {String} language
 * @param {IEventOrPlanningItem} item
 * @param {String} fieldName
 */
export function getTranslatedValue(language: string, item: IEventOrPlanningItem, fieldName: string): string | null {
    if (item.translations) {
        const matchingTranslation = item.translations.find(
            (translation) => translation.field === fieldName && translation.language === language
        );

        return matchingTranslation ? matchingTranslation.value : null;
    }
    return null;
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
    Container?: React.ComponentType,
    groupName?: string,
    enabledField: string = 'enabled',
    refs: {[key: string]: React.RefObject<any>} = {},
    schema?: IProfileSchema,
    coverageProfile?: ISearchProfile,
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
                coverageProfile: coverageProfile,
            },
            name: fieldName,
            ...profile[fieldName],
        };

        if (refs?.[fieldName] != null) {
            newField.props.refNode = refs[fieldName];
        }

        if (schema?.[fieldName] != null) {
            newField.props.schema = schema[fieldName];
        }

        if (newField.component == null) {
            console.error(`Component for field ${fieldName} not registered`);
        } else if (profile[fieldName].enabled &&
            profile[fieldName][enabledField] &&
            (!groupName || newField.group === groupName) &&
            fieldProps[fieldName]?.enabled != false
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
    Container?: React.ComponentType,
    enabledField: string = 'enabled'
) {
    const {gettext} = superdeskApi.localization;

    const groups = [{
        name: 'no_group',
    }, {
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
    }, {
        name: 'details',
        title: gettext('Details'),
    },
    ];

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
            return group.name == 'no_group' ? renderedFields : (
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

type IPreviewGroups = {[key: string]: Array<{
    name: 'no_group'
        | 'common'
        | 'vocabularies'
        | 'states'
        | 'dates'
        | 'events'
        | 'planning'
        | 'details';
    fields: Array<string>;
}>};

const PREVIEW_GROUPS: IPreviewGroups = {
    [PREVIEW_PANEL.EVENT]: [{
        name: 'no_group',
        fields: [
            'language',
            'slugline',
            'name',
            'priority',
            'definition_short',
            'occur_status',
            'dates',
            'calendars',
            'place',
            'location',
            'event_contact_info',
            'related_items',
        ],
    }, {
        name: 'details',
        fields: [
            'anpa_category',
            'subject',
            'custom_vocabularies',
            'definition_long',
            'internal_note',
            'ednote',
            'registration_details',
            'invitation_details',
            'accreditation_info',
            'accreditation_deadline',
        ],
    }],
    [PREVIEW_PANEL.PLANNING]: [{
        name: 'no_group',
        fields: [
            'language',
            'slugline',
            'headline',
            'name',
            'planning_date',
            'priority',
            'description_text',
            'internal_note',
            'place',
            'agendas',
        ],
    }, {
        name: 'details',
        fields: [
            'ednote',
            'anpa_category',
            'subject',
            'custom_vocabularies',
            'urgency',
            'flags',
        ]
    }],
    [PREVIEW_PANEL.COVERAGE]: [{
        name: 'no_group',
        fields: [
            'language',
            'slugline',
            'priority',
            'ednote',
            'keyword',
            'internal_note',
            'g2_content_type',
            'genre',
            'news_coverage_status',
            'scheduled',
            'flags',
        ],
    }],
    [PREVIEW_PANEL.ASSOCIATED_EVENT]: [{
        name: 'no_group',
        fields: [
            'name',
            'dates',
            'location',
            'occur_status',
            'priority',
            'definition_short',
            'event_contact_info',
        ],
    }],
    [PREVIEW_PANEL.ASSIGNMENT]: [{
        name: 'no_group',
        fields: [
            'language',
            'slugline',
            'place',
            'anpa_category',
            'subject',
            'genre',
            'keyword',
            'ednote',
            'internal_note',
        ],
    }],
    [PREVIEW_PANEL.SCHEDULED_COVERAGE_UPDATE]: [{
        name: 'no_group',
        fields: [
            'genre',
            'internal_note',
            'news_coverage_status',
            'scheduled',
        ],
    }]
};

export function previewGroupToProfile(
    groupName: PREVIEW_PANEL,
    profile,
    includeGroups = true,
    skipFieldsMissingInProfile = false
) {
    const previewProfile = {};

    PREVIEW_GROUPS[groupName]?.forEach((group) => {
        group.fields.forEach((field, index) => {
            if (skipFieldsMissingInProfile && profile?.editor?.[field] == null) {
                return;
            }

            previewProfile[field] = {
                index: index,
                group: includeGroups ? group.name : 'no_group',
                enabled: profile?.editor?.[field]?.enabled,
            };
        });
    });

    return previewProfile;
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

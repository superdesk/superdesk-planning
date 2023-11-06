import {superdeskApi} from '../../../superdeskApi';
import {IPlanningCoverageItem, IPlanningItem} from '../../../interfaces';

import {IPreviewHocOptions, previewHoc} from './base/PreviewHoc';
import {PreviewSimpleListItem} from './base/PreviewSimpleListItem';
import {PreviewFormItem} from './base/PreviewFormItem';
import {PreviewFormMultilingualText} from './base/PreviewFormMultilingualText';

import {PreviewFieldFilterSchedule} from '../common/PreviewFilterSchedule';
import {PreviewFieldEventSchedule} from './EventSchedule';
import {PreviewFieldLocation} from './Location';
import {PreviewFieldContacts} from './Contacts';
import {PreviewFieldCustomVocabularies} from './CustomVocabularies';
import {PreviewFieldUrgency} from './Urgency';
import {PreviewFieldFlags} from './Flags';

import * as selectors from '../../../selectors';
import {planningUtils} from '../../../utils';

import {
    getPreviewString,
    getPreviewBooleanString,
    getValuesFromCV,
    getValueFromCV,
    getDateTimeValue,
    getItemTypeName,
    getStringAttribute,
    getLockState,
    getDateFilterString,
    getSpikeStateString,
    getWorkflowStateString,
    getPreviewDateForPlanning,
    getLanguageString,
    getG2ContentTypeString,
    getKeywordsString,
} from './base/converters';

const fieldOptions: {[key: string]: IPreviewHocOptions} = {
    ad_hoc_planning: {
        props: () => ({label: superdeskApi.localization.gettext('Ad Hoc Planning')}),
        getValue: getPreviewBooleanString,
    },
    coverage_assignment_status: {
        props: () => ({label: superdeskApi.localization.gettext('Coverage Assignment Status')}),
        getValue: getPreviewString,
    },
    agendas: {
        props: () => ({
            label: superdeskApi.localization.gettext('Agendas'),
            defaultString: superdeskApi.localization.gettext('No agendas assigned.')
        }),
        getValue: getValuesFromCV('agendas', '_id'),
        mapStateToProps: (state) => ({agendas: selectors.planning.agendas(state)}),
    },
    calendars: {
        props: () => ({
            label: superdeskApi.localization.gettext('Calendars'),
            defaultString: superdeskApi.localization.gettext('No calendars assigned.'),
        }),
        getValue: getValuesFromCV('calendars'),
        mapStateToProps: (state) => ({calendars: selectors.events.calendars(state)}),
    },
    anpa_category: {
        props: () => ({label: superdeskApi.localization.gettext('ANPA Category')}),
        getValue: getValuesFromCV('categories'),
        mapStateToProps: (state) => ({categories: selectors.vocabs.categories(state)}),
    },
    g2_content_type: {
        props: () => ({label: superdeskApi.localization.gettext('Coverage Type')}),
        getValue: getG2ContentTypeString,
        mapStateToProps: (state) => ({contentTypes: selectors.general.contentTypes(state)}),
    },
    end_date: {
        props: () => ({label: superdeskApi.localization.gettext('To')}),
        getValue: getDateTimeValue,
    },
    exclude_rescheduled_and_cancelled: {
        props: () => ({label: superdeskApi.localization.gettext('Exclude Rescheduled And Cancelled')}),
        getValue: getPreviewBooleanString,
    },
    featured: {
        props: () => ({label: superdeskApi.localization.gettext('Featured')}),
        getValue: getPreviewBooleanString
    },
    full_text: {
        props: () => ({label: superdeskApi.localization.gettext('Search Text')}),
        getValue: getPreviewString,
    },
    include_killed: {
        props: () => ({label: superdeskApi.localization.gettext('Include Killed')}),
        getValue: getPreviewBooleanString,
    },
    include_scheduled_updates: {
        props: () => ({label: superdeskApi.localization.gettext('Include Scheduled Updates')}),
        getValue: getPreviewBooleanString,
    },
    source: {
        props: () => ({label: superdeskApi.localization.gettext('Ingest Source')}),
        getValue: getValuesFromCV('sources', 'id'),
        mapStateToProps: (state) => ({sources: selectors.general.ingestProviders(state)}),
    },
    item_type: {
        props: () => ({label: superdeskApi.localization.gettext('Item Type')}),
        getValue: getItemTypeName,
    },
    language: {
        props: () => ({label: superdeskApi.localization.gettext('Language')}),
        getValue: getLanguageString,
        mapStateToProps: (state) => ({languages: selectors.vocabs.getLanguages(state)}),
    },
    location: {
        props: () => ({label: superdeskApi.localization.gettext('Location')}),
        getValue: getStringAttribute('name'),
    },
    lock_state: {
        props: () => ({label: superdeskApi.localization.gettext('Lock State')}),
        getValue: getLockState,
    },
    no_agenda_assigned: {
        props: () => ({label: superdeskApi.localization.gettext('No Agenda Assigned')}),
        getValue: getPreviewBooleanString,
    },
    no_calendar_assigned: {
        props: () => ({label: superdeskApi.localization.gettext('No Calendar Assigned')}),
        getValue: getPreviewBooleanString,
    },
    no_coverage: {
        props: () => ({label: superdeskApi.localization.gettext('No Coverge')}),
        getValue: getPreviewBooleanString,
    },
    posted: {
        props: () => ({label: superdeskApi.localization.gettext('Posted')}),
        getValue: getPreviewBooleanString,
    },
    place: {
        props: () => ({label: superdeskApi.localization.gettext('Places')}),
        getValue: getValuesFromCV('places'),
        mapStateToProps: (state) => ({places: selectors.vocabs.locators(state)}),
    },
    date_filter: {
        props: () => ({label: superdeskApi.localization.gettext('Date Filter')}),
        getValue: getDateFilterString,
    },
    spike_state: {
        props: () => ({label: superdeskApi.localization.gettext('Spike State')}),
        getValue: getSpikeStateString,
    },
    start_date: {
        props: () => ({label: superdeskApi.localization.gettext('From')}),
        getValue: getDateTimeValue,
    },
    subject: {
        props: () => ({label: superdeskApi.localization.gettext('Subjects')}),
        getValue: getValuesFromCV('subjects'),
        mapStateToProps: (state) => ({subjects: selectors.vocabs.subjects(state)}),
    },
    urgency: {
        props: () => ({label: superdeskApi.localization.gettext('Urgency')}),
        getValue: getStringAttribute('name'),
    },
    state: {
        props: () => ({label: superdeskApi.localization.gettext('Workflow State')}),
        getValue: getWorkflowStateString,
    },
    occur_status: {
        props: () => ({label: superdeskApi.localization.gettext('Occurrence Status')}),
        getValue: getValueFromCV('statuses'),
        mapStateToProps: (state) => ({statuses: selectors.vocabs.eventOccurStatuses(state)}),
    },
    planning_date: {
        props: () => ({label: superdeskApi.localization.gettext('Planning Date')}),
        getValue: getPreviewDateForPlanning,
    },
    keyword: {
        props: () => ({label: superdeskApi.localization.gettext('Keywords')}),
        getValue: getKeywordsString,
    },
    accreditation_deadline: {
        props: () => ({label: superdeskApi.localization.gettext('Accreditation Deadline')}),
        getValue: getDateTimeValue,
    },
    genre: {
        props: () => ({label: superdeskApi.localization.gettext('Genre')}),
        getValue: getValueFromCV('genres'),
        mapStateToProps: (state) => ({genres: state.genres}),
    },
    scheduled: {
        props: () => ({label: superdeskApi.localization.gettext('Due')}),
        getValue: (value: undefined, props: {item: IPlanningCoverageItem}) => (
            !props.item.planning.scheduled ?
                superdeskApi.localization.gettext('Not scheduled yet') :
                planningUtils.getCoverageDateTimeText(props.item)
        ),
    },
    news_coverage_status: {
        props: () => ({label: superdeskApi.localization.gettext('Coverage Status')}),
        getValue: getValueFromCV('news_coverage_status'),
        mapStateToProps: (state) => ({news_coverage_status: selectors.general.newsCoverageStatus(state)}),
    },
};

const multilingualFieldOptions: {[key: string]: IPreviewHocOptions} = {
    name: {
        props: () => ({
            label: superdeskApi.localization.gettext('Name'),
            style: 'strong',
        }),
        getValue: getPreviewString,
    },
    reference: {
        props: () => ({label: superdeskApi.localization.gettext('Reference')}),
        getValue: getPreviewString,
    },
    slugline: {
        props: () => ({
            label: superdeskApi.localization.gettext('Slugline'),
            style: 'slugline',
        }),
        getValue: getPreviewString,
    },
    definition_short: {
        props: () => ({
            label: superdeskApi.localization.gettext('Description'),
            convertNewlineToBreak: true,
        }),
        getValue: getPreviewString,
    },
    definition_long: {
        props: () => ({
            label: superdeskApi.localization.gettext('Long Description'),
            convertNewlineToBreak: true,
        }),
        getValue: getPreviewString,
    },
    internal_note: {
        props: () => ({
            label: superdeskApi.localization.gettext('Internal Note'),
            expandable: true,
        }),
        getValue: getPreviewString,
    },
    ednote: {
        props: () => ({
            label: superdeskApi.localization.gettext('Ednote'),
            convertNewlineToBreak: true,
        }),
        getValue: getPreviewString,
    },
    headline: {
        props: () => ({label: superdeskApi.localization.gettext('Headline')}),
        getValue: getPreviewString,
    },
    description_text: {
        props: () => ({
            label: superdeskApi.localization.gettext('Description'),
            convertNewlineToBreak: true,
        }),
        getValue: getPreviewString,
    },
    registration_details: {
        props: () => ({
            label: superdeskApi.localization.gettext('Registration Details'),
            convertNewlineToBreak: true,
        }),
        getValue: getPreviewString,
    },
    invitation_details: {
        props: () => ({
            label: superdeskApi.localization.gettext('Invitation Details'),
            convertNewlineToBreak: true,
        }),
        getValue: getPreviewString,
    },
    accreditation_info: {
        props: () => ({label: superdeskApi.localization.gettext('Accreditation Info')}),
        getValue: getPreviewString,
    },
    priority: {
        props: () => ({label: superdeskApi.localization.gettext('Priority:')}),
        getValue: getPreviewString,
    },
};

let FIELD_TO_PREVIEW_COMPONENT: {[key: string]: any} = {};
let FIELD_TO_FORM_PREVIEW_COMPONENT: {[key: string]: any} = {};

Object.keys(fieldOptions).forEach((field) => {
    FIELD_TO_PREVIEW_COMPONENT[field] = previewHoc(fieldOptions[field], PreviewSimpleListItem, field);
    FIELD_TO_FORM_PREVIEW_COMPONENT[field] = previewHoc(fieldOptions[field], PreviewFormItem, field);
});

Object.keys(multilingualFieldOptions).forEach((field) => {
    FIELD_TO_PREVIEW_COMPONENT[field] = previewHoc(multilingualFieldOptions[field], PreviewSimpleListItem, field);
    FIELD_TO_FORM_PREVIEW_COMPONENT[field] = previewHoc(
        multilingualFieldOptions[field],
        PreviewFormMultilingualText,
        field
    );
});

FIELD_TO_PREVIEW_COMPONENT.filter_schedule = PreviewFieldFilterSchedule;

FIELD_TO_FORM_PREVIEW_COMPONENT.dates = PreviewFieldEventSchedule;
FIELD_TO_FORM_PREVIEW_COMPONENT.location = PreviewFieldLocation;
FIELD_TO_FORM_PREVIEW_COMPONENT.event_contact_info = PreviewFieldContacts;
FIELD_TO_FORM_PREVIEW_COMPONENT.custom_vocabularies = PreviewFieldCustomVocabularies;
FIELD_TO_FORM_PREVIEW_COMPONENT.urgency = PreviewFieldUrgency;
FIELD_TO_FORM_PREVIEW_COMPONENT.flags = PreviewFieldFlags;

export {
    FIELD_TO_PREVIEW_COMPONENT,
    FIELD_TO_FORM_PREVIEW_COMPONENT,
};

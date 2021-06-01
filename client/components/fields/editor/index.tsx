import * as React from 'react';

import {EditorFieldCategories} from './Categories';
import {EditorFieldCoverageType} from './CoverageType';
import {EditorFieldEndDateTime} from './EndDateTime';
import {EditorFieldFeatured} from './Featured';
import {EditorFieldIngestSource} from './IngestSource';
import {EditorFieldItemType} from './ItemType';
import {EditorFieldLocation} from './Location';
import {EditorFieldName} from './Name';
import {EditorFieldNoCoverage} from './NoCoverage';
import {EditorFieldOnlyPosted} from './OnlyPosted';
import {EditorFieldPlace} from './Place';
import {EditorFieldReference} from './Reference';
import {EditorFieldRelativeDate} from './RelativeDate';
import {EditorFieldSlugline} from './Slugline';
import {EditorFieldSpikeState} from './SpikeState';
import {EditorFieldStartDateTime} from './StartDateTime';
import {EditorFieldSubjects} from './Subjects';
import {EditorFieldUrgency} from './Urgency';
import {EditorFieldWorkflowState} from './WorkflowState';
import {EditorFieldFullText} from './FullText';
import {EditorFieldLanguage} from './Language';
import {EditorFieldIncludeKilled} from './IncludeKilled';
import {EditorFieldLockState} from './LockState';
import {EditorFieldCalendars} from './Calendars';
import {EditorFieldAgendas} from './Agendas';
import {EditorFieldNoCalendarAssigned} from './NoCalendarAssigned';
import {EditorFieldExcludeRescheduledAndCancelled} from './ExcludeRescheduledAndCancelled';
import {EditorFieldNoAgendaAssigned} from './NoAgendaAssigned';
import {EditorFieldAdHocPlanning} from './AdHocPlanning';
import {EditorFieldIncludeScheduledUpdates} from './IncludeScheduledUpdates';
import {EditorFieldDeskId} from './DeskId';
import {EditorFieldScheduleFrequency} from './ScheduleFrequency';
import {EditorFieldDays} from './Days';
import {EditorFieldExportTemplate} from './ExportTemplate';
import {EditorFieldContentTemplate} from './ContentTemplate';
import {EditorFieldScheduleHour} from './ScheduleHour';
import {EditorFieldScheduleMonthDay} from './ScheduleMonthDay';
import {EditorFieldEventRecurringRules} from './EventRecurringRules';
import {EditorFieldEventSchedule} from './EventSchedule';
import {EditorFieldDefinitionShort} from './DefinitionShort';
import {EditorFieldContacts} from './Contacts';
import {EditorFieldEventOccurenceStatus} from './EventOccurenceStatus';
import {EditorFieldEventAttachments} from './EventAttachments';
import {EditorFieldEventLinks} from './EventLinks';
import {EditorFieldEventRelatedPlannings} from './EventRelatedPlannings/EventRelatedPlannings';
import {EditorFieldHeadline} from './Headline';
import {EditorFieldPlanningDateTime} from './PlanningDateTime';
import {EditorFieldNotForPublication} from './NotForPublication';
import {EditorFieldOverrideAutoAssignToWorkflow} from './OverrideAutoAssignToWorkflow';
import {EditorFieldAssociatedEvent} from './AssociatedEvent';
import {EditorFieldCoverages} from './Coverages';
import {EditorFieldGenre} from './Genre';
import {EditorFieldNewsCoverageStatus} from './NewsCoverageStatus';
import {EditorFieldKeywords} from './Keywords';
import {EditorFieldCoverageSchedule} from './CoverageSchedule';
import {EditorFieldNoContentLinking} from './NoContentLinking';
import {EditorFieldCoverageContact} from './CoverageContact';
import {EditorFieldXMPFile} from './XMPFile';
import {EditorFieldScheduledUpdates} from './ScheduledUpdates';
import {EditorFieldCustomVocabularies} from './CustomVocabularies';
import {EditorFieldDefinitionLong} from './DefinitionLong';
import {EditorFieldEdnote} from './Ednote';
import {EditorFieldDescriptionText} from './DescriptionText';
import {EditorFieldInternalNote} from './InternalNote';

export const FIELD_TO_EDITOR_COMPONENT = {
    anpa_category: EditorFieldCategories,
    featured: EditorFieldFeatured,
    source: EditorFieldIngestSource,
    location: EditorFieldLocation,
    name: EditorFieldName,
    place: EditorFieldPlace,
    reference: EditorFieldReference,
    slugline: EditorFieldSlugline,
    subject: EditorFieldSubjects,
    urgency: EditorFieldUrgency,
    state: EditorFieldWorkflowState,

    noCoverage: EditorFieldNoCoverage,
    no_coverage: EditorFieldNoCoverage,

    spikeState: EditorFieldSpikeState,
    spike_state: EditorFieldSpikeState,

    coveragetype: EditorFieldCoverageType,
    contentType: EditorFieldCoverageType,
    content_type: EditorFieldCoverageType,
    g2_content_type: EditorFieldCoverageType,

    posted: EditorFieldOnlyPosted,
    pubstatus: EditorFieldOnlyPosted,
    pub_status: EditorFieldOnlyPosted,

    'dates.start': EditorFieldStartDateTime,
    startDateTime: EditorFieldStartDateTime,
    start_date_time: EditorFieldStartDateTime,
    start_date: EditorFieldStartDateTime,

    'dates.end': EditorFieldEndDateTime,
    endDateTime: EditorFieldEndDateTime,
    end_date_time: EditorFieldEndDateTime,
    end_date: EditorFieldEndDateTime,

    'dates.range': EditorFieldRelativeDate,
    dateFilters: EditorFieldRelativeDate,
    date_filter: EditorFieldRelativeDate,

    item_type: EditorFieldItemType,
    repo: EditorFieldItemType,

    full_text: EditorFieldFullText,
    language: EditorFieldLanguage,
    include_killed: EditorFieldIncludeKilled,
    lock_state: EditorFieldLockState,
    calendars: EditorFieldCalendars,
    agendas: EditorFieldAgendas,
    no_calendar_assigned: EditorFieldNoCalendarAssigned,
    exclude_rescheduled_and_cancelled: EditorFieldExcludeRescheduledAndCancelled,
    no_agenda_assigned: EditorFieldNoAgendaAssigned,
    ad_hoc_planning: EditorFieldAdHocPlanning,
    include_scheduled_updates: EditorFieldIncludeScheduledUpdates,

    desk: EditorFieldDeskId,
    frequency: EditorFieldScheduleFrequency,
    week_days: EditorFieldDays,
    export_template: EditorFieldExportTemplate,
    content_template: EditorFieldContentTemplate,
    hour: EditorFieldScheduleHour,
    month_day: EditorFieldScheduleMonthDay,

    'dates.recurring_rules': EditorFieldEventRecurringRules,
    dates: EditorFieldEventSchedule,
    definition_short: EditorFieldDefinitionShort,
    definition_long: EditorFieldDefinitionLong,
    internal_note: EditorFieldInternalNote,
    ednote: EditorFieldEdnote,
    description_text: EditorFieldDescriptionText,
    contacts: EditorFieldContacts,
    event_contact_info: EditorFieldContacts,
    occur_status: EditorFieldEventOccurenceStatus,
    files: EditorFieldEventAttachments,
    links: EditorFieldEventLinks,
    related_plannings: EditorFieldEventRelatedPlannings,
    headline: EditorFieldHeadline,
    planning_date: EditorFieldPlanningDateTime,
    'flags.marked_for_not_publication': EditorFieldNotForPublication,
    'flags.overide_auto_assign_to_workflow': EditorFieldOverrideAutoAssignToWorkflow,
    associated_event: EditorFieldAssociatedEvent,
    coverages: EditorFieldCoverages,
    genre: EditorFieldGenre,
    news_coverage_status: EditorFieldNewsCoverageStatus,
    keywords: EditorFieldKeywords,
    coverage_schedule: EditorFieldCoverageSchedule,
    'flags.no_content_linking': EditorFieldNoContentLinking,
    coverage_contact: EditorFieldCoverageContact,
    xmp_file: EditorFieldXMPFile,
    scheduled_updates: EditorFieldScheduledUpdates,
    custom_vocabularies: EditorFieldCustomVocabularies,
};

// Import resource fields so that registration happens after the above
import '../resources/index';

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
};

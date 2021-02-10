import * as React from 'react';

import {PreviewFieldAgendas} from './Agendas';
import {PreviewFieldCalendars} from './Calendars';
import {PreviewFieldCategories} from './Categories';
import {PreviewFieldItemType} from './ItemType';
import {PreviewFieldPlaces} from './Places';
import {PreviewFieldSubjects} from './Subjects';
import {PreviewFieldWorkflowState} from './WorkflowState';
import {PreviewFieldCoverageType} from './CoverageType';
import {PreviewFieldEndDate} from './EndDate';
import {PreviewFieldFeatured} from './Featured';
import {PreviewFieldIngestSource} from './IngestSource';
import {PreviewFieldLocation} from './Location';
import {PreviewFieldName} from './Name';
import {PreviewFieldNoCoverage} from './NoCoverage';
import {PreviewFieldOnlyPosted} from './OnlyPosted';
import {PreviewFieldReference} from './Reference';
import {PreviewFieldRelativeDate} from './RelativeDate';
import {PreviewFieldSlugline} from './Slugline';
import {PreviewFieldSpikeState} from './SpikeState';
import {PreviewFieldStartDate} from './StartDate';
import {PreviewFieldUrgency} from './Urgency';
import {PreviewFieldFullText} from './FullText';
import {PreviewFieldLanguage} from './Language';
import {PreviewFieldIncludeKilled} from './IncludeKilled';
import {PreviewFieldLockState} from './LockState';
import {PreviewFieldNoCalendarAssigned} from './NoCalendarAssigned';
import {PreviewFieldNoAgendaAssigned} from './NoAgendaAssigned';
import {PreviewFieldAdHocPlanning} from './AdHocPlanning';
import {PreviewFieldIncludeScheduledUpdates} from './IncludeScheduledUpdates';
import {PreviewFieldFilterSchedule} from '../../common/PreviewFilterSchedule';

export const FIELD_TO_PREVIEW_COMPONENT = {
    agendas: PreviewFieldAgendas,
    calendars: PreviewFieldCalendars,
    anpa_category: PreviewFieldCategories,
    item_type: PreviewFieldItemType,
    place: PreviewFieldPlaces,
    subject: PreviewFieldSubjects,
    state: PreviewFieldWorkflowState,
    g2_content_type: PreviewFieldCoverageType,
    end_date: PreviewFieldEndDate,
    featured: PreviewFieldFeatured,
    source: PreviewFieldIngestSource,
    location: PreviewFieldLocation,
    name: PreviewFieldName,
    no_coverage: PreviewFieldNoCoverage,
    posted: PreviewFieldOnlyPosted,
    reference: PreviewFieldReference,
    date_filter: PreviewFieldRelativeDate,
    slugline: PreviewFieldSlugline,
    spike_state: PreviewFieldSpikeState,
    start_date: PreviewFieldStartDate,
    urgency: PreviewFieldUrgency,
    full_text: PreviewFieldFullText,
    language: PreviewFieldLanguage,
    include_killed: PreviewFieldIncludeKilled,
    lock_state: PreviewFieldLockState,
    no_calendar_assigned: PreviewFieldNoCalendarAssigned,
    no_agenda_assigned: PreviewFieldNoAgendaAssigned,
    ad_hoc_planning: PreviewFieldAdHocPlanning,
    include_scheduled_updates: PreviewFieldIncludeScheduledUpdates,
    filter_schedule: PreviewFieldFilterSchedule,
};

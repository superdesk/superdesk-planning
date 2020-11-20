import {ITEM_STATE, ISuperdeskGlobalConfig, IBaseRestApiResponse, ISubject, IUser} from 'superdesk-api';
import moment from 'moment';

export interface IPlanningNewsCoverageStatus {
    qcode: 'ncostat:int' | 'ncostat:notdec' | 'ncostat:notint' | 'ncostat:onreq';
    name: string;
    label: string;
}

export interface IG2ContentType {
    qcode: string;
    name: string;
    'content item type': string;
}

export interface IGenre {
    qcode: string;
    name: string;
}

export interface IKeyword {
    qcode: string;
    name: string;
}

export interface IUrgency {
    qcode: number;
    name: string;
}

export interface IEventOccurStatus {
    qcode: string;
    name: string;
    label: string;
}

export interface ICalendar {
    qcode: string;
    name: string;
}

export interface IANPACategory {
    qcode: string;
    name: string;
    subject: string;
}

export type IFile = {
    _id: string;
    filemeta: {
        content_type: string;
        filename: string;
        length: number;
        media_id: string;
    };
    media: {
        content_type: string;
        file: any;
        length: number;
        name: string;
        _id: string;
    };
};

export type IPlanningWorkflowStatus = 'assigned' | 'in_progress' | 'completed' | 'submitted' | 'cancelled' | 'reverted';
export type IPlanningPubstatus = 'usable' | 'cancelled';

export type IPlanningAssignedTo = {
    assignment_id: string;
    state: string;
    contact: string;
};

export type IEventUpdateMethod = 'single' | 'future' | 'all';

export type ISearchSpikeState = 'spiked' | 'draft' | 'both';

export type IDateRange = 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'last24' | 'forDate';

export type IPlanningProfile = {
    name: string;
    editor: {
        [id: string]: {
            enabled: boolean;
        }
    };
    schema: {
        [id: string]: {
            type: string;
            required: boolean;
            schema: any;
            mandatory_in_list: boolean;
            minlength: number;
            maxlength: number;
        }
    };
}

export type IPlace = {
    scheme: string;
    qcode: string;
    code: string;
    name: string;
    locality: string;
    state: string;
    country: string;
    world_region: string;
    locality_code: string;
    state_code: string;
    country_code: string;
    world_region_code: string;
    feature_class: string;
    location: string;
    rel: string;
};

export interface IPlanningConfig extends ISuperdeskGlobalConfig {
    event_templates_enabled?: boolean;
    long_event_duration_threshold?: number;
    max_multi_day_event_duration?: number;
    max_recurrent_events?: number;
    planning_allow_freetext_location: boolean;
    planning_allow_scheduled_updates?: boolean;
    planning_auto_assign_to_workflow?: boolean;
    planning_check_for_assignment_on_publish?: boolean;
    planning_check_for_assignment_on_send?: boolean;
    planning_fulfil_on_publish_for_desks: Array<string>;
    planning_link_updates_to_coverage?: boolean;
    planning_use_xmp_for_pic_assignments?: boolean;
    planning_use_xmp_for_pic_slugline?: boolean;
    planning_xmp_assignment_mapping?: string;
    street_map_url?: string;

    planning?: {
        dateformat?: string;
        timeformat?: string;
        allowed_coverage_link_types?: Array<string>;
    };
}

export interface ISession {
    sessionId: string;
    identity: IUser;
}

export interface ILocation {
    qcode?: string;
    name?: string;
    address?: string;
    geo?: string;
    location?: string;
    formatted_address: string;
    details: Array<string>;
}

export interface ILock {
    action: string;
    item_id: string;
    item_type: string;
    session: string;
    time: string;
    user: string;
}

export interface ILockedItems {
    assignment: {[key: string]: ILock};
    event: {[key: string]: ILock};
    planning: {[key: string]: ILock};
    recurring: {[key: string]: ILock};
}


// The Event, Planning and Coverage interfaces were directly derived from the schema on the Server
export interface IAgenda {
    _id: string;
    name: string;
    original_creator: string;
    version_creator: string;
    is_enabled: boolean;
}

export interface IEventItem {
    _id?: string;
    _created?: string;
    _updated?: string;
    guid?: string;
    unique_id?: string;
    unique_name?: string;
    version?: number;
    ingest_id?: string;
    recurrence_id?: string;
    previous_recurrence_id?: string;
    original_creator?: string;
    version_creator?: string;
    firstcreated?: string;
    versioncreated?: string;
    ingest_provider?: string;
    source?: string;
    original_source?: string;
    ingest_provider_sequence?: string;
    event_created?: string | Date;
    event_lastmodified?: string | Date;
    name?: string;
    definition_short?: string;
    definition_long?: string;
    internal_note?: string;
    anpa_category?: Array<IANPACategory>;
    files?: Array<string>;
    relationships?: {
        broader?: string;
        narrower?: string;
        related?: string;
    }
    links?: Array<string>;
    dates?: {
        start?: string | Date | moment.Moment;
        end?: string | Date | moment.Moment;
        tz?: string;
        duration?: string;
        confirmation?: string;
        recurring_date?: Array<Date>;
        recurring_rule?: {
            frequency?: string;
            interval?: number;
            endRepeatMode?: 'count' | 'until';
            until?: string | Date;
            count?: number;
            bymonth?: string;
            byday?: string;
            byhour?: string;
            byminute?: string;
        };
        occur_status?: {
            qcode?: string;
            name?: string;
        };
        ex_date?: Array<Date>;
        ex_rule?: {
            frequency?: string;
            interval?: string;
            until?: string | Date;
            bymonth?: string;
            byday?: string;
            byhour?: string;
            byminute?: string;
        }
    };
    _planning_schedule?: Array<{
        scheduled?: string | Date;
    }>;
    occur_status?: IEventOccurStatus;
    news_coverage_status?: {
        qcode?: string;
        name?: string;
    };
    registration?: string;
    access_status?: Array<{
        qcode?: string;
        name?: string;
    }>;
    subject?: Array<ISubject>;
    slugline?: string;
    location?: ILocation;
    participant?: Array<{
        qcode?: string;
        name?: string;
    }>;
    participant_requirement?: Array<{
        qcode?: string;
        name?: string;
    }>;
    organizer?: Array<{
        qcode?: string;
        name?: string;
    }>;
    event_contact_info?: Array<string>;
    language?: string;
    state?: ITEM_STATE;
    expiry?: string | Date;
    expired?: boolean;
    pubstatus?: IPlanningPubstatus;
    lock_user?: string;
    lock_time?: string | Date;
    lock_session?: string;
    lock_action?: string;
    update_method?: IEventUpdateMethod;
    type?: string;
    calendars?: Array<ICalendar>;
    revert_state?: ITEM_STATE;
    duplicate_from?: string;
    duplicate_to?: Array<string>;
    reschedule_from?: string;
    reschedule_to?: string;
    _reschedule_from_schedule?: string | Date;
    place?: Array<IPlace>;
    ednote?: string;
    state_reason?: string;
    actioned_date?: string | Date;
    completed?: boolean;
    _time_to_be_confirmed?: boolean;
    _planning_item?: string;
    planning_ids?: Array<string>;
    _plannings?: Array<IPlanningItem>;
    template?: string;
    _sortDate?: string | Date | moment.Moment;
}

export interface ICoveragePlanningDetails {
    ednote: string;
    g2_content_type: string;
    coverage_provider: string;
    contact_info: string;
    item_class: string;
    item_count: string;
    scheduled: string | Date;
    _scheduledTime: string;
    files: Array<string>;
    xmp_file: string;
    service: Array<{
        qcode: string;
        name: string;
    }>;
    news_content_characteristics: Array<{
        qcode: string;
        name: string;
    }>;
    planning_ext_property: Array<{
        qcode: string;
        value: string;
        name: string;
    }>;
    by: Array<string>;
    credit_line: Array<string>;
    dateline: Array<string>;
    description_text: string;
    genre: {
        qcode: string;
        name: string;
    };
    headline: string;
    keyword: Array<string>;
    language: string;
    slugline: string;
    internal_note: string;
    workflow_status_reason: string;
}

export interface ICoverageScheduledUpdate {
    scheduled_update_id: string;
    coverage_id: string;
    workflow_status: IPlanningWorkflowStatus;
    assigned_to: IPlanningAssignedTo;
    previous_status: IPlanningWorkflowStatus;
    news_coverage_status: IPlanningNewsCoverageStatus;
    planning: {
        internal_note: string;
        contact_info: string;
        scheduled: string | Date;
        genre: Array<{
            qcode: string;
            name: string;
        }>;
        workflow_status_reason: string;
    };
}

export interface IPlanningCoverageItem {
    coverage_id: string;
    guid: string;
    original_creator: string;
    version_creator: string;
    firstcreated: string;
    versioncreated: string;

    planning: ICoveragePlanningDetails;

    news_coverage_status: IPlanningNewsCoverageStatus;
    workflow_status: IPlanningWorkflowStatus;
    previous_status: IPlanningWorkflowStatus;
    assigned_to: IPlanningAssignedTo;
    flags: {
        no_content_linking: boolean;
    };
    _time_to_be_confirmed: boolean;
    scheduled_updates: Array<ICoverageScheduledUpdate>;
}

export interface IPlanningItem {
    _id: string;
    _created?: string;
    _updated?: string;
    guid: string;
    original_creator: string;
    version_creator: string;
    firstcreated: string;
    versioncreated: string;
    agendas: Array<string>;
    event_item: string;
    recurrence_id: string;
    item_class: string;
    ednote: string;
    description_text: string;
    internal_note: string;
    anpa_category: Array<IANPACategory>;
    subject: Array<ISubject>;
    genre: Array<{
        qcode: string;
        name: string;
    }>;
    company_codes: Array<{
        qcode: string;
        name: string;
        security_exchange: string;
    }>;
    language: string;
    abstract: string;
    headline: string;
    slugline: string;
    keywords: Array<string>;
    word_count: number;
    priority: number;
    urgency: number;
    profile: string;
    state: ITEM_STATE;
    expiry: string | Date;
    expired: boolean;
    featured: boolean;
    lock_user: string;
    lock_time: string | Date;
    lock_session: string;
    lock_action: string;
    coverages: Array<IPlanningCoverageItem>;
    _planning_schedule: Array<{
        coverage_id: string;
        scheduled: string | Date;
    }>;
    _updated_schedule: Array<{
        scheduled_update_id: string;
        scheduled: string | Date;
    }>;
    planning_date: string | Date;
    flags: {
        marked_for_not_publication: boolean;
        overide_auto_assign_to_workflow: boolean;
    };
    pubstatus: IPlanningPubstatus;
    revert_state: ITEM_STATE;
    type: string;
    unique_id: string;
    place: Array<IPlace>;
    name: string;
    files: Array<string>;
    state_reason: string;
    reason: string;
    _time_to_be_confirmed: boolean;
    _cancelAllCoverage: boolean;
}

export enum ASSIGNMENT_STATE {
    DRAFT = 'draft',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    SUBMITTED = 'submitted',
    CANCELLED = 'cancelled',
}

export interface IAssignmentItem extends IBaseRestApiResponse {
    name: string;
    description_text: string;
    priority: number;
    accepted: boolean;
    planning: ICoveragePlanningDetails;

    coverage_item: string;
    planning_item: string;
    scheduled_update_id: string;

    assigned_to: {
        desk: string;
        user: string;
        assignor_desk: string;
        assignor_user: string;
        assigned_date_desk: string | Date;
        assigned_date_user: string | Date;
        contact: string;
        state: ASSIGNMENT_STATE;
        revert_state: ASSIGNMENT_STATE;
        coverage_provider: {
            qcode: string;
            name: string;
            contact_type: string;
        };
    };

    original_creator: string;
    version_creator: string;
    firstcreated: string;
    versioncreated: string;
    type: string;
    lock_user: string;
    lock_time: string | Date;
    lock_session: string;
    lock_action: string;
    _to_delete: boolean;
}

export interface IDateSearchParams {
    range?: IDateRange;
    start?: moment.Moment;
    end?: moment.Moment;
}

export interface IEventSearchParams {
    calendars?: Array<string>;
    fulltext?: string;
    ids?: Array<string>;
    includeKilled?: boolean;
    itemIds?: Array<string>;
    maxResults?: number;
    noCalendarAssigned?: boolean;
    onlyFuture?: boolean;
    recurrenceId?: string;
    page?: number;
    startOfWeek?: number;
    spikeState?: ISearchSpikeState;
    advancedSearch?: {
        anpa_category?: Array<IANPACategory>;
        dates?: IDateSearchParams;
        location?: ILocation | string;
        name?: string;
        place?: Array<{
            qcode?: string;
        }>;
        posted?: boolean;
        reference?: string;
        slugline?: string;
        source?: Array<{
            id?: string;
            name?: string;
        }>;
        state?: Array<{
            qcode?: string;
            name?: string;
        }>;
        subject?: Array<ISubject>;
    };
}

export interface IPlanningSearchParams {
    adHocPlanning?: boolean;
    agendas?: Array<string>;
    excludeRescheduledAndCancelled?: boolean;
    featured?: boolean;
    fulltext?: string;
    includeScheduledUpdates?: boolean;
    noAgendaAssigned?: boolean;
    spikeState?: ISearchSpikeState;
    startOfWeek?: number;
    timezoneOffset?: string;
    advancedSearch?: {
        anpa_category?: Array<IANPACategory>;
        dates?: IDateSearchParams;
        featured?: boolean;
        g2_content_type?: {
            qcode?: string;
            name?: string;
        };
        noCoverage?: boolean;
        place?: Array<{
            qcode?: string;
            name?: string;
        }>;
        posted?: boolean;
        slugline?: string;
        state?: Array<{
            qcode?: string;
            name?: string;
        }>;
        subject?: Array<ISubject>;
        urgency?: {
            qcode?: string;
            name?: string;
        };
    };
}

export interface IElasticQuery {
    must?: Array<any>;
    must_not?: Array<any>;
    filter?: Array<any>;
    should?: Array<any>;
    minimum_should_match?: number;
    sort?: Array<any>;
}

interface IProfileEditorField {
    enabled: boolean;
}

interface IProfileEditorDatesField extends IProfileEditorField {
    default_duration_on_change: number;
    all_day: {
        enabled: boolean;
    };
}

interface IProfileSchemaType<T> {
    type: T;
    required: boolean;
    mandatory_in_list?: {[key: string]: any};
}

interface IProfileSchemaTypeList extends IProfileSchemaType<'list'> {
    schema?: {[key: string]: any};
}

interface IProfileSchemaTypeInteger extends IProfileSchemaType<'integer'> {}
interface IProfileSchemaTypeDict extends IProfileSchemaType<'dict'> {}
interface IProfileSchemaTypeDateTime extends IProfileSchemaType<'datetime'> {}

interface IProfileSchemaTypeString extends IProfileSchemaType<'string'> {
    minlength?: number;
    maxlength?: number;
}

export interface IEventFormProfile {
    editor: {
        anpa_category: IProfileEditorField;
        calendars: IProfileEditorField;
        dates: IProfileEditorDatesField;
        definition_long: IProfileEditorField;
        definition_short: IProfileEditorField;
        ednote: IProfileEditorField;
        event_contact_info: IProfileEditorField;
        files: IProfileEditorField;
        internal_note: IProfileEditorField;
        language: IProfileEditorField;
        links: IProfileEditorField;
        location: IProfileEditorField;
        name: IProfileEditorField;
        occur_status: IProfileEditorField;
        place: IProfileEditorField;
        reference: IProfileEditorField;
        slugline: IProfileEditorField;
        subject: IProfileEditorField;
    };
    name: 'event';
    schema: {
        anpa_category: IProfileSchemaTypeList;
        calendars: IProfileSchemaTypeList;
        dates: IProfileSchemaTypeDict;
        definition_long: IProfileSchemaTypeString;
        definition_short: IProfileSchemaTypeString;
        ednote: IProfileSchemaTypeString;
        event_contact_info: IProfileSchemaTypeList;
        files: IProfileSchemaTypeList;
        internal_note: IProfileSchemaTypeString;
        language: IProfileSchemaTypeString;
        links: IProfileSchemaTypeList;
        location: IProfileSchemaTypeString;
        name: IProfileSchemaTypeString;
        occur_status: IProfileSchemaTypeDict;
        place: IProfileSchemaTypeList;
        reference: IProfileSchemaTypeString;
        slugline: IProfileSchemaTypeString;
        subject: IProfileSchemaTypeList;
    };
}

export interface IPlanningFormProfile {
    editor: {
        agendas: IProfileEditorField;
        anpa_category: IProfileEditorField;
        description_text: IProfileEditorField;
        ednote: IProfileEditorField;
        files: IProfileEditorField;
        flags: IProfileEditorField;
        headline: IProfileEditorField;
        internal_note: IProfileEditorField;
        language: IProfileEditorField;
        name: IProfileEditorField;
        place: IProfileEditorField;
        planning_date: IProfileEditorField;
        slugline: IProfileEditorField;
        subject: IProfileEditorField;
        urgency: IProfileEditorField;
    };
    name: 'planning';
    schema: {
        agendas: IProfileSchemaTypeList;
        anpa_category: IProfileSchemaTypeList;
        description_text: IProfileSchemaTypeString;
        ednote: IProfileSchemaTypeString;
        files: IProfileSchemaTypeList;
        flags: IProfileSchemaTypeDict;
        headline: IProfileSchemaTypeString;
        internal_note: IProfileSchemaTypeString;
        language: IProfileSchemaTypeString;
        name: IProfileSchemaTypeString;
        place: IProfileSchemaTypeList;
        planning_date: IProfileSchemaTypeDateTime;
        slugline: IProfileSchemaTypeString;
        subject: IProfileSchemaTypeList;
        urgency: IProfileSchemaTypeInteger;
    };
}

export interface ICoverageFormProfile {
    editor: {
        contact_info: IProfileEditorField;
        ednote: IProfileEditorField;
        files: IProfileEditorField;
        flags: IProfileEditorField;
        g2_content_type: IProfileEditorField;
        genre: IProfileEditorField;
        headline: IProfileEditorField;
        internal_note: IProfileEditorField;
        keyword: IProfileEditorField;
        language: IProfileEditorField;
        news_coverage_status: IProfileEditorField;
        scheduled: IProfileEditorField;
        slugline: IProfileEditorField;
    };
    name: 'coverage';
    schema: {
        contact_info: IProfileSchemaTypeString;
        ednote: IProfileSchemaTypeString;
        files: IProfileSchemaTypeList;
        flags: IProfileSchemaTypeDict;
        g2_content_type: IProfileSchemaTypeList;
        genre: IProfileSchemaTypeList;
        headline: IProfileSchemaTypeString;
        internal_note: IProfileSchemaTypeString;
        keyword: IProfileSchemaTypeList;
        language: IProfileSchemaTypeString;
        news_coverage_status: IProfileSchemaTypeList;
        scheduled: IProfileSchemaTypeDateTime;
        slugline: IProfileSchemaTypeString;
    };
}

export interface IFormProfiles {
    coverage: ICoverageFormProfile;
    event: IEventFormProfile;
    planning: IPlanningFormProfile;
}

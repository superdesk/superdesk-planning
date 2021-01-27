import {
    ITEM_STATE,
    ISuperdeskGlobalConfig,
    IBaseRestApiResponse,
    ISubject,
    IUser,
    IRestApiResponse,
    IDesk,
    IContentProfile,
} from 'superdesk-api';
import {Store} from 'redux';
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

export interface IAssignmentPriority {
    name: string;
    qcode: number;
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

export interface ILocator {
    country?: string;
    group: string;
    name: string;
    qcode: string;
    state?: string;
    world_region: string;
}

export interface ICoverageProvider {
    qcode: string;
    name: string;
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

export enum JUMP_INTERVAL {
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH'
}

export type IPlanningWorkflowStatus = 'assigned' | 'in_progress' | 'completed' | 'submitted' | 'cancelled' | 'reverted';
export type IPlanningPubstatus = 'usable' | 'cancelled';
export type IWorkflowState =
    | 'draft'
    | 'active'
    | 'ingested'
    | 'scheduled'
    | 'killed'
    | 'cancelled'
    | 'rescheduled'
    | 'postponed'
    | 'spiked';

export type IPlanningAssignedTo = {
    assignment_id: string;
    state: string;
    contact: string;
};

export type IEventUpdateMethod = 'single' | 'future' | 'all';

export enum SEARCH_SPIKE_STATE {
    SPIKED = 'spiked',
    NOT_SPIKED = 'draft',
    BOTH = 'both'
}

export enum FILTER_TYPE {
    EVENTS = 'events',
    PLANNING = 'planning',
    COMBINED = 'combined',
}

export enum DATE_RANGE {
    TODAY = 'today',
    TOMORROW = 'tomorrow',
    THIS_WEEK = 'this_week',
    NEXT_WEEK = 'next_week',
    LAST_24 = 'last24',
    FOR_DATE = 'forDate',
}

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

export interface IEventItem extends IBaseRestApiResponse {
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
    state?: IWorkflowState;
    expiry?: string | Date;
    expired?: boolean;
    pubstatus?: IPlanningPubstatus;
    lock_user?: string;
    lock_time?: string | Date;
    lock_session?: string;
    lock_action?: string;
    update_method?: IEventUpdateMethod;
    type: 'event';
    calendars?: Array<ICalendar>;
    revert_state?: IWorkflowState;
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
    g2_content_type: IG2ContentType['qcode'];
    coverage_provider: string;
    contact_info: string;
    item_class: string;
    item_count: string;
    scheduled: string | Date | moment.Moment;
    _scheduledTime: string | Date | moment.Moment;
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

export interface IPlanningItem extends IBaseRestApiResponse {
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
    state: IWorkflowState;
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
    planning_date: string | Date | moment.Moment;
    flags?: {
        marked_for_not_publication?: boolean;
        overide_auto_assign_to_workflow?: boolean;
    };
    pubstatus: IPlanningPubstatus;
    revert_state: IWorkflowState;
    type: 'planning';
    unique_id: string;
    place: Array<IPlace>;
    name: string;
    files: Array<string>;
    state_reason: string;
    reason: string;
    _time_to_be_confirmed: boolean;
    _cancelAllCoverage: boolean;
}

export interface IFeaturedPlanningItem extends IBaseRestApiResponse {
    date: string;
    items: Array<IPlanningItem['_id']>;
    tz: string;
    posted: boolean;
    last_posted_time: string;
    last_posted_by: IUser['_id'];
    original_creator: IUser['_id'];
    version_creator: IUser['_id'];
    firstcreated: string;
    versioncreated: string;
    type: 'planning_featured';
}

export interface IFeaturedPlanningLock extends IBaseRestApiResponse {
    lock_user: string;
    lock_time: string | Date;
    lock_session: string;
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
    calendars?: Array<ICalendar['qcode']>;
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
        place?: Array<IPlace>;
        posted?: boolean;
        reference?: string;
        slugline?: string;
        source?: Array<{
            id?: string;
            name?: string;
        }>;
        state?: Array<{
            qcode?: IWorkflowState;
            name?: string;
        }>;
        subject?: Array<ISubject>;
        language?: string;
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
        g2_content_type?: IG2ContentType;
        noCoverage?: boolean;
        place?: Array<IPlace>;
        posted?: boolean;
        slugline?: string;
        state?: Array<{
            qcode?: IWorkflowState;
            name?: string;
        }>;
        subject?: Array<ISubject>;
        urgency?: IUrgency;
        language?: string;
        name: string;
    };
}

export interface IAdvancedSearchParams {
    // Combined
    anpa_category?: Array<IANPACategory>;
    dates?: IDateSearchParams;
    item_type: FILTER_TYPE;
    maxResults?: number;
    name?: string;
    place?: Array<IPlace>;
    posted?: boolean;
    slugline?: string;
    spikeState?: SEARCH_SPIKE_STATE;
    state?: Array<{
        qcode: IWorkflowState;
        name: string;
    }>;
    subject?: Array<ISubject>;

    // Events Only
    event?: {
        calendars?: Array<ICalendar['qcode']>;
        location?: Array<ILocation | string>;
        noCalendarAssigned?: boolean;
        reference?: string;
        source?: Array<{
            id?: string;
            name?: string;
        }>;
    }

    // Planning Only
    planning?: {
        adHocPlanning?: boolean;
        agendas?: Array<IAgenda['_id']>;
        featured?: boolean;
        g2_content_type?: IG2ContentType;
        noAgendaAssigned?: boolean;
        noCoverage?: boolean;
        urgency?: IUrgency;
    }
}

export interface ICombinedSearchParams {
    fulltext?: string;
    spikeState?: ISearchSpikeState;
    page?: number;
    maxResults?: number;
    calendars?: Array<ICalendar>;
    agendas: Array<IAgenda>;
    places?: Array<IPlace>;
    filter_id?: ISearchFilter['_id'];
    advancedSearch?: {
        name?: string;
        anpa_category?: Array<IANPACategory>;
        subject?: Array<ISubject>;
        place?: Array<IPlace>;
        slugline?: string;
        reference?: string;
        state?: Array<{
            qcode?: IWorkflowState;
            name?: string;
        }>;
        posted?: boolean;
        dates?: IDateSearchParams;
    };
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
    validate_on_post?: boolean;
}

interface IProfileSchemaTypeList extends IProfileSchemaType<'list'> {
    schema?: {[key: string]: any};
    mandatory_in_list?: {[key: string]: any};
}

interface IProfileSchemaTypeInteger extends IProfileSchemaType<'integer'> {}
interface IProfileSchemaTypeDict extends IProfileSchemaType<'dict'> {}
interface IProfileSchemaTypeDateTime extends IProfileSchemaType<'datetime'> {}

interface IProfileSchemaTypeString extends IProfileSchemaType<'string'> {
    minlength?: number;
    maxlength?: number;
}

export interface IAdvancedSearchFormProfileField {
    enabled: boolean;
    index: number;
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

export interface IEventSearchProfile {
    slugline: IAdvancedSearchFormProfileField,
    reference: IAdvancedSearchFormProfileField,
    name: IAdvancedSearchFormProfileField,
    anpa_category: IAdvancedSearchFormProfileField,
    subject: IAdvancedSearchFormProfileField,
    source: IAdvancedSearchFormProfileField,
    location: IAdvancedSearchFormProfileField,
    state: IAdvancedSearchFormProfileField,
    pub_status: IAdvancedSearchFormProfileField,
    spike_state: IAdvancedSearchFormProfileField,
    start_date_time: IAdvancedSearchFormProfileField,
    end_date_time: IAdvancedSearchFormProfileField,
    date_filter: IAdvancedSearchFormProfileField,
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

export interface IPlanningSearchProfile {
    slugline: IAdvancedSearchFormProfileField;
    content_type: IAdvancedSearchFormProfileField;
    no_coverage: IAdvancedSearchFormProfileField;
    featured: IAdvancedSearchFormProfileField;
    anpa_category: IAdvancedSearchFormProfileField;
    subject: IAdvancedSearchFormProfileField;
    urgency: IAdvancedSearchFormProfileField;
    state: IAdvancedSearchFormProfileField;
    pub_status: IAdvancedSearchFormProfileField;
    spike_state: IAdvancedSearchFormProfileField;
    start_date_time: IAdvancedSearchFormProfileField;
    end_date_time: IAdvancedSearchFormProfileField;
    date_filter: IAdvancedSearchFormProfileField;
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

export interface ICombinedSearchProfile {
    slugline: IAdvancedSearchFormProfileField;
    reference: IAdvancedSearchFormProfileField;
    anpa_category: IAdvancedSearchFormProfileField;
    subject: IAdvancedSearchFormProfileField;
    state: IAdvancedSearchFormProfileField;
    pub_status: IAdvancedSearchFormProfileField;
    spike_state: IAdvancedSearchFormProfileField;
    start_date_time: IAdvancedSearchFormProfileField;
    end_date_time: IAdvancedSearchFormProfileField;
    date_filter: IAdvancedSearchFormProfileField;
}

export interface IAdvancedSearchFormProfile {
    name: 'advanced_search';
    schema: {};
    editor: {
        event: IEventSearchProfile;
        planning: IPlanningSearchProfile;
        combined: ICombinedSearchProfile;
    };
}

export type ISearchProfile = {[key: string]: IAdvancedSearchFormProfileField};

export interface IFormProfiles {
    coverage: ICoverageFormProfile;
    event: IEventFormProfile;
    planning: IPlanningFormProfile;
}

export interface IFormNavigation {
    scrollToViewItem?: any;
    contacts?: any;
    event?: any;
    details?: any;
    files?: any;
    links?: any;
    planning?: any;
}

export interface IFormItemManager {
    forceUpdateInitialValues(updates: Partial<IEventItem | IPlanningItem>): void;
    startPartialSave(updates: Partial<IEventItem | IPlanningItem>): void;
    addCoverageToWorkflow(
        planning: IPlanningItem,
        coverage: IPlanningCoverageItem,
        index: number
    ): Promise<IPlanningItem>;
    removeAssignment(
        planning: IPlanningItem,
        coverage: IPlanningCoverageItem,
        index: number
    ): Promise<IPlanningItem>;
    cancelCoverage(
        planning: IPlanningItem,
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate: ICoverageScheduledUpdate,
        scheduledUpdateIndex: number
    ): Promise<void>;
    addScheduledUpdateToWorkflow(
        planning: IPlanningItem,
        coverage: IPlanningCoverageItem,
        coverageIndex: number,
        scheduledUpdate: ICoverageScheduledUpdate,
        index: number
    ): Promise<IPlanningItem>;
    finalisePartialSave(diff: Partial<IEventItem | IPlanningItem>, updateDirtyFlag: boolean): Promise<void>;
}

export interface ISearchParams {
    // Common Params
    item_ids?: Array<string>;
    name?: string;
    tz_offset?: string;
    full_text?: string;
    anpa_category?: Array<IANPACategory>;
    subject?: Array<ISubject>;
    posted?: boolean;
    place?: Array<IPlace>;
    language?: string;
    state?: Array<{
        qcode?: string;
        name?: string;
    }>;
    spike_state?: ISearchSpikeState;
    include_killed?: boolean;
    date_filter?: IDateRange;
    start_date?: string | Date | moment.Moment;
    end_date?: string | Date | moment.Moment;
    only_future?: boolean;
    start_of_week?: number;
    slugline?: string;
    lock_state?: 'locked' | 'unlocked';
    recurrence_id?: string; // Both Events and Planning have recurrence_id
    filter_id?: ISearchFilter['_id'];

    // Event Params
    reference?: string;
    source?: Array<{
        id?: string;
        name?: string;
    }>;
    location?: ILocation;
    calendars?: Array<ICalendar>;
    no_calendar_assigned?: boolean;

    // Planning Params
    agendas?: Array<IAgenda['_id']>;
    no_agenda_assigned?: boolean;
    ad_hoc_planning?: boolean;
    exclude_rescheduled_and_cancelled?: boolean;
    no_coverage?: boolean;
    urgency?: IUrgency;
    g2_content_type?: IG2ContentType;
    featured?: boolean;
    include_scheduled_updates?: boolean;
    event_item?: Array<IEventItem['_id']>;

    // Combined Params
    include_associated_planning?: boolean;

    // Pagination
    page?: number;
    max_results?: number;
}

export interface ISearchAPIParams {
    // Common Params
    item_ids?: string;
    name?: string;
    tz_offset?: string;
    full_text?: string;
    anpa_category?: string;
    subject?: string;
    posted?: boolean;
    place?: string;
    language?: string;
    state?: string;
    spike_state?: ISearchSpikeState;
    include_killed?: boolean;
    date_filter?: IDateRange;
    start_date?: string;
    end_date?: string;
    start_of_week?: number;
    slugline?: string;
    lock_state?: 'locked' | 'unlocked';
    recurrence_id?: string;
    filter_id?: ISearchFilter['_id'];

    // Event Params
    reference?: string;
    source?: string;
    location?: ILocation['name'];
    calendars?: string;
    no_calendar_assigned?: boolean;
    only_future?: boolean;

    // Planning Params
    agendas?: string;
    no_agenda_assigned?: boolean;
    ad_hoc_planning?: boolean;
    exclude_rescheduled_and_cancelled?: boolean;
    no_coverage?: boolean;
    urgency?: IUrgency['qcode'];
    g2_content_type?: IG2ContentType['qcode'];
    featured?: boolean;
    include_scheduled_updates?: boolean;
    event_item?: string;

    // Combined Params
    include_associated_planning?: boolean;

    // Pagination
    page?: number;
    max_results?: number;
    repo: FILTER_TYPE;
}

export interface ICommonFilterProfile {
    name: IAdvancedSearchFormProfileField;
    full_text: IAdvancedSearchFormProfileField;
    anpa_category: IAdvancedSearchFormProfileField;
    subject: IAdvancedSearchFormProfileField;
    posted: IAdvancedSearchFormProfileField;
    place: IAdvancedSearchFormProfileField;
    language: IAdvancedSearchFormProfileField;
    state: IAdvancedSearchFormProfileField;
    spike_state: IAdvancedSearchFormProfileField;
    include_killed: IAdvancedSearchFormProfileField;
    date_filter: IAdvancedSearchFormProfileField;
    start_date: IAdvancedSearchFormProfileField;
    end_date: IAdvancedSearchFormProfileField;
    slugline: IAdvancedSearchFormProfileField;
    lock_state: IAdvancedSearchFormProfileField;
}

export enum WEEK_DAY {
    SUNDAY = 'Sunday',
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
}

export enum SCHEDULE_FREQUENCY {
    HOURLY = 'hourly',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}

export interface ISearchFilterSchedule {
    desk: IDesk['_id'];
    article_template?: string;
    template?: string;
    _last_sent?: string;
    frequency: SCHEDULE_FREQUENCY;
    hour: number;
    day: number;
    week_days: Array<WEEK_DAY>;
}

export interface ISearchFilter extends IBaseRestApiResponse {
    name: string;
    item_type: FILTER_TYPE;
    params: ISearchParams;
    schedules?: Array<ISearchFilterSchedule>;
}

export interface IEditFilterFieldProps {
    filter: ISearchFilter;
    invalid: boolean;
    errors: {[key: string]: string};
    onChange<T extends keyof ISearchFilter>(field: T, value: ISearchFilter[T]): void;
    getPopupContainer(): any;
    language: string;
}

export interface IEditorFieldProps {
    item: any;
    field: string;
    label: string;
    required?: boolean;
    defaultValue?: any;
    autoFocus?: boolean;
    errors?: {[key: string]: string};
    invalid?: boolean;
    language?: string;
    testId?: string;

    onChange(field: string, value: any): void;
    popupContainer?(): HTMLElement;
}

export interface IListFieldProps {
    item: any;
    field?: string;
}

export type IRenderPanelType =
    | 'editor'
    | 'list'
    | 'simple-preview';

export type IEventsPlanningField =
    | 'calendars'
    | 'agendas'
    | 'places'
    | 'name'
    | 'item_type'
    | 'anpa_category'
    | 'subjects'
    | 'state';

export interface IEventsPlanningContentPanelProps {
    filter?: Partial<ISearchFilter>;
    onClose(): void;
    onSave(filter: Partial<ISearchFilter>): Promise<void>;
    editFilter(filter: ISearchFilter): void;
    editFilterSchedule(filter: ISearchFilter): void;
    deleteFilterSchedule(filter: ISearchFilter): void;
    previewFilter(filter: ISearchFilter): void;
}

export interface IPlanningExportTemplate extends IBaseRestApiResponse {
    name: string;
    type: 'event' | 'planning' | 'combined';
    data: {[key: string]: any};
    label: string;
    download?: boolean;
}

export interface IContentTemplate extends IBaseRestApiResponse {
    is_public: boolean;
    template_name: string;
    template_type: string;
    template_desks: Array<IDesk['_id']>;
    user: IUser['_id'];
    data: {
        flags: {
            marked_archived_only: boolean;
            marked_for_legal: boolean;
            marked_for_not_publication: boolean;
            marked_for_sms: boolean;
        };
        format: string;
        profile: IContentProfile['_id'];
        pubstatus: string;
        type: string;
    };
}

export interface IPlanningAPI {
    redux: {
        store: Store;
    };
    events: {
        search(params: ISearchParams): Promise<IRestApiResponse<IEventItem>>;
        searchGetAll(params: ISearchParams): Promise<Array<IEventItem>>;
        getById(eventId: IEventItem['_id']): Promise<IEventItem>;
        getByIds(eventIds: Array<IEventItem['_id']>, spikeState?: ISearchSpikeState): Promise<Array<IEventItem>>;
        getLocked(): Promise<Array<IEventItem>>;
        getEditorProfile(): IEventFormProfile;
        getSearchProfile(): IEventSearchProfile;
    };
    planning: {
        search(params: ISearchParams): Promise<IRestApiResponse<IPlanningItem>>;
        searchGetAll(params: ISearchParams): Promise<Array<IPlanningItem>>;
        getById(planId: IPlanningItem['_id']): Promise<IPlanningItem>;
        getByIds(planIds: Array<IPlanningItem['_id']>): Promise<Array<IPlanningItem>>;
        getLocked(): Promise<Array<IPlanningItem>>;
        getLockedFeatured(): Promise<Array<IFeaturedPlanningLock>>;
        getEditorProfile(): IPlanningFormProfile;
        getSearchProfile(): IPlanningSearchProfile;
        featured: {
            lock(): Promise<Partial<IFeaturedPlanningLock>>;
            unlock(): Promise<undefined>;
            getById(id: string): Promise<IFeaturedPlanningItem>;
            getByDate(date: moment.Moment): Promise<IFeaturedPlanningItem>;
        };
    };
    coverages: {
        getEditorProfile(): ICoverageFormProfile;
    };
    combined: {
        search(params: ISearchParams): Promise<IRestApiResponse<IEventItem | IPlanningItem>>;
        searchGetAll(params: ISearchParams): Promise<Array<IEventItem | IPlanningItem>>;
        getRecurringEventsAndPlanningItems(
            event: IEventItem,
            loadPlannings?: boolean,
            loadEvents?: boolean,
        ): Promise<{
            events: Array<IEventItem>;
            plannings: Array<IPlanningItem>;
        }>
        getSearchProfile(): ICombinedSearchProfile;
        getEventsAndPlanning(params: ISearchParams): Promise<{
            events: Array<IEventItem>;
            plannings: Array<IPlanningItem>;
        }>;
    }
    search<T>(args: ISearchAPIParams): Promise<IRestApiResponse<T>>;
}

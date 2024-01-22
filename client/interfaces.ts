import {
    ISuperdeskGlobalConfig,
    IBaseRestApiResponse,
    ISubject,
    IUser,
    IRestApiResponse,
    IDesk,
    IContentProfile,
    IArticle,
    IVocabulary,
    IVocabularyItem,
    RICH_FORMATTING_OPTION,
} from 'superdesk-api';
import {Dispatch, Store} from 'redux';
import * as moment from 'moment';
import * as React from 'react';

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

export interface ILanguage {
    qcode: string;
    name: string;
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
export interface ICoverageAssigned {
    qcode: string;
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
    is_active?: boolean;
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

export interface IIngestProvider {
    id: string;
    name: string;
    display_name?: string;
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

export interface IItemUrlParams {
    id: IEventOrPlanningItem['_id'];
    type: IEventOrPlanningItem['type'];
}

export enum JUMP_INTERVAL {
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH'
}

export type IPlanningWorkflowStatus = 'draft'
    | 'assigned'
    | 'in_progress'
    | 'completed'
    | 'submitted'
    | 'cancelled'
    | 'reverted'
    // `spiked` is only used in the front-end,
    // to remove items from AdvancedCoverage modal
    | 'spiked';

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
    assignment_id: IAssignmentItem['_id'];
    state: IPlanningWorkflowStatus;
    contact: IContactItem['_id'];
    user: IUser['_id'];
    desk: IDesk['_id'];
    coverage_provider: {
        qcode: string;
        name: string;
        contact_type: string;
    };
};

export type IEventUpdateMethod = 'single' | 'future' | 'all';

export enum ITEM_TYPE {
    EVENT = 'event',
    PLANNING = 'planning',
    ASSIGNMENT = 'assignment',
    TEXT = 'text',
    PICTURE = 'picture',
    VIDEO = 'video',
    AUDIO = 'audio',
    GRAPHIC = 'graphic',
    COMPOSITE = 'composite',
    UNKNOWN = 'unknown',
}

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

export enum PLANNING_VIEW {
    EVENTS = 'EVENTS',
    PLANNING = 'PLANNING',
    COMBINED = 'COMBINED',
}

export enum PREVIEW_PANEL {
    EVENT = 'event',
    PLANNING = 'planning',
    COVERAGE = 'coverage',
    ASSOCIATED_EVENT = 'associated_event',
    ASSIGNMENT = 'assignment',
    SCHEDULED_COVERAGE_UPDATE = 'scheduled_coverage_update',
}

export enum DATE_RANGE {
    TODAY = 'today',
    TOMORROW = 'tomorrow',
    THIS_WEEK = 'this_week',
    NEXT_WEEK = 'next_week',
    LAST_24 = 'last24',
    FOR_DATE = 'for_date',
}

export enum LOCK_STATE {
    LOCKED = 'locked',
    UNLOCKED = 'unlocked',
}

export type ISearchSpikeState = 'spiked' | 'draft' | 'both';

export type IDateRange = 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'last24' | 'for_date';

export enum SORT_ORDER {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export enum SORT_FIELD {
    SCHEDULE = 'schedule',
    CREATED = 'created',
    UPDATED = 'updated'
}

export enum LIST_VIEW_TYPE {
    SCHEDULE = 'schedule',
    LIST = 'list',
}

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
    planning_auto_close_popup_editor?: boolean;

    planning?: {
        dateformat?: string;
        timeformat?: string;
        allowed_coverage_link_types?: Array<string>;
        autosave_timeout?: number;
        default_create_planning_series_with_event_series?: boolean;
    };
}

export interface ISession {
    sessionId: string;
    identity: IUser;
}

export type IPrivileges = {[key: string]: number | boolean};

export interface ILocation extends IBaseRestApiResponse {
    guid: string;
    original_creator: IUser['_id'];
    firstcreated: string;
    version_creator: IUser['_id'];
    versioncreated: string;

    name?: string;
    translations?: {
        name: {[key: string]: string};
    };
    unique_name?: string;
    type?: string;
    is_active?: boolean;
    address: {
        title?: string;
        line?: Array<string>;
        locality?: string;
        suburb?: string;
        city?: string;
        area?: string;
        state?: string;
        country?: string;
        country_code?: string;
        postal_code?: string;
        external?: {
            nominatim: INominatimItem
        };
        type?: string;
        boundingbox?: Array<string>;
    };
    position?: {
        latitude?: number;
        longitude?: number;
        altitude?: number;
        gps_datum?: string;
    };
    details: Array<string>;
    formatted_address: Readonly<string>; // generated by the server on fetch
}

export interface ILock {
    action: IEventOrPlanningItem['lock_action'];
    item_id: IEventOrPlanningItem['_id'];
    item_type: IEventOrPlanningItem['type'] | IAssignmentItem['type'];
    session: IEventOrPlanningItem['lock_session'];
    time: IEventOrPlanningItem['lock_time'];
    user: IEventOrPlanningItem['lock_user'];
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

// An Event's Location could also come from an Ingest, not just the Locations DB
export interface IEventLocation {
    qcode?: string; // qcode may not be provided when the Event is ingested
    name: string;
    address?: Omit<ILocation['address'], 'external'>;
    details?: ILocation['details'];
    formatted_address?: Readonly<string>; // generated by the server on fetch
    geo?: string;
    location?: {
        lat: number;
        lon: number;
    };
}

export interface IItemAction {
    actionName?: string;
    label: string;
    key?: string;
    icon?: string;
    inactive?: boolean;
    text?: string;
    callback?(...args: Array<any>): void;
}

export interface IItemSubActions {
    create: {
        current: Array<IItemAction>;
        past: Array<IItemAction>;
    };
    createAndOpen: {
        current: Array<IItemAction>;
        past: Array<IItemAction>;
    };
}

export type IDateTime = moment.MomentInput;

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
    priority?: number;
    definition_short?: string;
    definition_long?: string;
    internal_note?: string;
    registration_details?: string;
    invitation_details?: string;
    anpa_category?: Array<IANPACategory>;
    files?: Array<string>;
    relationships?: {
        broader?: string;
        narrower?: string;
        related?: string;
    };
    links?: Array<string>;
    dates?: {
        all_day?: boolean;
        no_end_time?: boolean;
        start?: IDateTime;
        end?: IDateTime;
        tz?: string;
        duration?: string;
        confirmation?: string;
        recurring_date?: Array<Date>;
        recurring_rule?: {
            frequency?: string;
            interval?: number;
            endRepeatMode?: 'count' | 'until';
            until?: IDateTime;
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
    _startTime?: IDateTime;
    _endTime?: IDateTime;
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
    location?: IEventLocation;
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
    language?: IVocabularyItem['qcode'];
    languages?: Array<IVocabularyItem['qcode']>;
    state?: IWorkflowState;
    expiry?: string | Date;
    expired?: boolean;
    pubstatus?: IPlanningPubstatus;
    lock_user?: string;
    lock_time?: IDateTime;
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
    _sortDate?: IDateTime;

    translations?: Array<{
        field: string;
        language: string;
        value: string;
    }>;

    // Used only to add/modify Plannings/Coverages from the Event form
    // These are only stored with the Autosave and not the actual Event
    associated_plannings: Array<Partial<IPlanningItem>>;
    embedded_planning: Array<{
        planning_id?: IPlanningItem['_id'];
        coverages: Array<{
            coverage_id?: IPlanningCoverageItem['coverage_id'];
            g2_content_type: ICoveragePlanningDetails['g2_content_type'];
            desk: IPlanningAssignedTo['desk'];
            user: IPlanningAssignedTo['user'];
            language: ICoveragePlanningDetails['language'];
            news_coverage_status: IPlanningNewsCoverageStatus['qcode'];
            scheduled: ICoveragePlanningDetails['scheduled'];

            genre: ICoveragePlanningDetails['genre']['qcode'];
            slugline: ICoveragePlanningDetails['slugline'];
            ednote: ICoveragePlanningDetails['ednote'];
            internal_note: ICoveragePlanningDetails['internal_note'];
        }>;
    }>;

    // Attributes added by API (removed via modifyForClient)
    // The `_status` field is available when the item comes from a POST/PATCH request
    _status: any;
}

export interface IEventTemplate extends IBaseRestApiResponse {
    is_public: boolean;
    template_name: string;
    template_type: string;
    user: IUser['_id'];
    data: Partial<IEventItem>;
}

export interface ICoveragePlanningDetails {
    ednote: string;
    g2_content_type: IG2ContentType['qcode'];
    coverage_provider: string;
    contact_info: string;
    item_class: string;
    item_count: string;
    scheduled: IDateTime;
    _scheduledTime: IDateTime;
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
    priority?: number;
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
    language?: IVocabularyItem['qcode'];
    languages?: Array<IVocabularyItem['qcode']>;
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
    lock_time: IDateTime;
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
    planning_date: IDateTime;
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

    // Used when showing Associated Planning item for Events
    _agendas: Array<IAgenda>;

    // Attributes added by API (removed via modifyForClient)
    // The `_status` field is available when the item comes from a POST/PATCH request
    _status: any;
    translations?: Array<{
        field: string;
        language: string;
        value: string;
    }>;
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

export interface IFeaturedPlanningSaveItem {
    date?: moment.Moment;
    items: Array<IPlanningItem['_id']>;
    tz: string;
    posted?: boolean;
}

export interface IFeaturedPlanningLock extends IBaseRestApiResponse {
    lock_user: string;
    lock_time: IDateTime;
    lock_session: string;
}

export interface IContactItem extends IBaseRestApiResponse {
    is_active: boolean;
    public: boolean;
    organisation?: string;
    first_name?: string;
    last_name?: string;
    honorific?: string;
    job_title?: string;
    mobile?: Array<{
        number: string;
        usage?: string;
        public?: boolean;
    }>;
    contact_phone?: Array<{
        number: string;
        usage?: string;
        public?: boolean;
    }>;
    fax?: string;
    contact_email?: Array<string>;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
    contact_address?: Array<string>;
    locality?: string;
    city?: string;
    contact_state?: string;
    postcode?: string;
    country?: {
        name?: string;
        qcode?: string;
        translations: {[key: string]: string};
    };
    notes?: string;
    contact_type?: string;
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
    type: 'assignment';
    lock_user: string;
    lock_time: IDateTime;
    lock_session: string;
    lock_action: string;
    _to_delete: boolean;
}

export interface IBaseListItemProps<T> {
    item: T;
    lockedItems: ILockedItems;
    session: ISession;
    privileges: {[key: string]: number};
    activeFilter: PLANNING_VIEW;
    multiSelected: boolean;
    listFields: any;
    active: boolean;
    listViewType: LIST_VIEW_TYPE;
    sortField: SORT_FIELD;
    minTimeWidth: string;

    onItemClick(item: T): void;
    onMultiSelectClick(item: T): void;
    refNode(node: HTMLElement): void;
}

export interface IEventListItemProps extends IBaseListItemProps<IEventItem> {
    relatedPlanningText?: string;
    calendars: Array<ICalendar>;
    filterLanguage?: string;
    toggleRelatedPlanning?(event: React.MouseEvent): void;
}

export interface IPlanningListItemProps extends IBaseListItemProps<IPlanningItem> {
    date: string; // The date for this group, in the format YYYY-MM-DD
    agendas: Array<IAgenda>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    filterLanguage?: string;
    isAgendaEnabled?:boolean;
    // showUnlock?: boolean; // Is this used anymore?
    hideItemActions: boolean;
    showAddCoverage: boolean;
    contentTypes: Array<IG2ContentType>;
    contacts: {[key: string]: IContactItem};
    onAddCoverageClick(): void;
}

export interface IDateSearchParams {
    range?: IDateRange;
    start?: moment.Moment;
    end?: moment.Moment;
}

export type IEventOrPlanningItem = IEventItem | IPlanningItem;
export type IAssignmentOrPlanningItem = IEventOrPlanningItem | IAssignmentItem;

export interface ICommonAdvancedSearchParams {
    anpa_category?: Array<IANPACategory>;
    dates?: IDateSearchParams;
    name?: string;
    place?: Array<IPlace>;
    posted?: boolean;
    slugline?: string;
    state?: Array<{
        qcode?: IWorkflowState;
        name?: string;
    }>;
    subject?: Array<ISubject>;
    language?: string;
    source?: Array<{
        id?: string;
        name?: string;
    }>;
    priority?: Array<number>;
}

export interface ICommonSearchParams<T extends IEventOrPlanningItem> {
    itemIds?: Array<T['_id']>;
    fulltext?: string;
    includeKilled?: boolean;
    maxResults?: number;
    page?: number;
    onlyFuture?: boolean;
    startOfWeek?: number;
    spikeState?: ISearchSpikeState;
    filter_id?: ISearchFilter['_id'];
    lock_state?: LOCK_STATE;
    directly_locked?: boolean;
    timezoneOffset?: string;
    advancedSearch?: ICommonAdvancedSearchParams;
    sortOrder?: SORT_ORDER;
    sortField?: SORT_FIELD;
    source?:string;
    coverage_user_id?:string;
    coverage_assignment_status?:ICoverageAssigned['qcode'];
}

export interface IEventSearchParams extends ICommonSearchParams<IEventItem> {
    ids?: Array<IEventItem['_id']>;
    calendars?: Array<ICalendar>;
    noCalendarAssigned?: boolean;
    recurrenceId?: string;
    advancedSearch?: ICommonAdvancedSearchParams & {
        location?: IEventLocation;
        reference?: string;
    };

}

export interface IPlanningSearchParams extends ICommonSearchParams<IPlanningItem> {
    adHocPlanning?: boolean;
    agendas?: Array<IAgenda['_id']>;
    excludeRescheduledAndCancelled?: boolean;
    featured?: boolean;
    includeScheduledUpdates?: boolean;
    noAgendaAssigned?: boolean;
    coverage_assignment_status?:ICoverageAssigned['qcode'];
    advancedSearch?: ICommonAdvancedSearchParams & {
        featured?: boolean;
        g2_content_type?: IG2ContentType;
        noCoverage?: boolean;
        urgency?: IUrgency;
    };
}

export interface ICombinedSearchParams extends ICommonSearchParams<IEventOrPlanningItem>{
    advancedSearch?: ICommonAdvancedSearchParams & {
        reference?: string;
    };
}

export type ICombinedEventOrPlanningSearchParams = IEventSearchParams | IPlanningSearchParams | ICombinedSearchParams;

export interface IProfileEditorField {
    enabled: boolean;
    index?: number;
    group?: string;
    formatOptions?: Array<string>;
}

interface IProfileEditorDatesField extends IProfileEditorField {
    default_duration_on_change: number;
    all_day: {
        enabled: boolean;
    };
}

interface IBaseProfileSchemaType<T> {
    type: T;
    required: boolean;
    validate_on_post?: boolean;
    minlength?: number;
    maxlength?: number;
    default_value?: string | number;
}

export interface IProfileSchemaTypeList extends IBaseProfileSchemaType<'list'> {
    read_only?: boolean;
    schema?: {[key: string]: any};
    mandatory_in_list?: {[key: string]: any};
    vocabularies?: Array<IVocabulary['_id']>;
    planning_auto_publish?: boolean;
}

export interface IProfileSchemaTypeInteger extends IBaseProfileSchemaType<'integer'> {}
export interface IProfileSchemaTypeDict extends IBaseProfileSchemaType<'dict'> {}
export interface IProfileSchemaTypeDateTime extends IBaseProfileSchemaType<'datetime'> {}

export interface IProfileSchemaTypeString extends IBaseProfileSchemaType<'string'> {
    field_type: 'single_line' | 'multi_line' | 'editor_3';
    format_options?: Array<RICH_FORMATTING_OPTION>;
    expandable?: boolean;
    languages: Array<IVocabularyItem['qcode']>;
    multilingual?: boolean;
    default_language?: IVocabularyItem['qcode'];
}

export interface IProfileMultilingualDetails {
    isEnabled: boolean;
    defaultLanguage: IVocabularyItem['qcode'];
    languages: Array<ILanguage['qcode']>;
    fields: Array<string>;
}

export interface IAdvancedSearchFormProfileField {
    enabled: boolean;
    index: number;
    group?: string;
}

export interface IEditorProfileGroup {
    _id: string;
    name: string;
    index: number;
    icon: string;
    useToggleBox?: boolean;
    showBookmark?: boolean;
    translations: {
        name: {[key: string]: string};
    };
}

export interface IProfileFieldEntry {
    name: string;
    field: IProfileEditorField;
    schema: IProfileSchemaType;
}

export interface IEditorProfile {
    // The name identifies the form in the UI to which the type relates
    _id?: Readonly<string>;
    name: Readonly<string>;

    // editor controls which fields are visible in the UI
    editor: {[key: string]: IProfileEditorField};

    // schema controls the validation of fields at the front end
    schema: {[key: string]: IProfileSchemaType};

    // postSchema controls the validation of fields when posting.
    postSchema?: {[key: string]: IProfileSchemaType};

    // list fields config
    list?: {[key: string]: any};

    // list fields when seeing events/planning when exporting or downloading
    export_list?: Array<string>;

    // list of groups (and their translations) for grouping of fields in the Editor
    groups: {[key: string]: IEditorProfileGroup};
    // groups: Array<IEditorProfileGroup>;

    // Audit Information
    created_by: Readonly<IUser['_id']>;
    updated_by: Readonly<IUser['_id']>;
    firstcreated: Readonly<Date>;
    versioncreated: Readonly<Date>;
    init_version: Readonly<number>;
}

export type IPlanningContentProfile = IBaseRestApiResponse & IEditorProfile;

export interface IEventFormProfile {
    editor: {
        anpa_category: IProfileEditorField;
        calendars: IProfileEditorField;
        dates: IProfileEditorDatesField;
        definition_long: IProfileEditorField;
        definition_short: IProfileEditorField;
        registration_details: IProfileEditorField;
        invitation_details: IProfileEditorField;
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
        registration_details: IProfileSchemaTypeString;
        invitation_details: IProfileSchemaTypeString;
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
    coverage_assignment_status: IAdvancedSearchFormProfileField;
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

export type IProfileSchema = IEventFormProfile['schema']
    | IPlanningFormProfile['schema']
    | ICoverageFormProfile['schema'];

export type IProfileSchemaType = IProfileSchemaTypeList
    | IProfileSchemaTypeInteger
    | IProfileSchemaTypeDict
    | IProfileSchemaTypeDateTime
    | IProfileSchemaTypeString;

export type IFormProfileItem = IEventFormProfile
    | IPlanningFormProfile
    | ICoverageFormProfile;

export interface IFormNavigation {
    scrollToViewItem?: any;
    contacts?: any;
    event?: any;
    details?: any;
    files?: any;
    links?: any;
    planning?: any;
    onTabChange?(index: number): void;
}

export interface IFormItemManager {
    forceUpdateInitialValues(updates: Partial<IEventOrPlanningItem>): void;
    startPartialSave(updates: Partial<IEventOrPlanningItem>): boolean;
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
    finalisePartialSave(diff: DeepPartial<IEventOrPlanningItem>, updateDirtyFlag: boolean): Promise<void>;
    setState(newState: Partial<IEditorState>): Promise<IEditorState>;
    getState(): IEditorState;
    getProps(): IEditorProps;
    editor: any;
    resetForm(
        initialValues?: IEventOrPlanningItem,
        diff?: DeepPartial<IEventOrPlanningItem>,
        dirty?: boolean,
        callback?: () => void,
    ): Promise<IEditorState>;
}

export interface IFormAutosave {
    flushAutosave(): Promise<void>;
    cancelAutosave(): void;
    saveAutosave(props: IEditorProps, diff: IEditorState['diff']): Promise<void>;
    loadAutosave(props: IEditorProps): Promise<IEditorState['diff']>;
    createAutosave(diff: IEditorState['diff']): Promise<void>;
    createOrLoadAutosave(props: IEditorProps, diff: IEditorState['diff']): Promise<void>;
    remove(): Promise<void>;
}

export interface ISearchParams {
    // Common Params
    item_ids?: Array<string>;
    name?: string;
    tz_offset?: string;
    time_zone?: string;
    full_text?: string;
    anpa_category?: Array<IANPACategory>;
    subject?: Array<ISubject>;
    posted?: boolean;
    place?: Array<IPlace>;
    language?: string;
    state?: Array<{
        qcode?: IWorkflowState;
        name?: string;
    }>;
    spike_state?: ISearchSpikeState;
    include_killed?: boolean;
    date_filter?: IDateRange;
    start_date?: IDateTime;
    end_date?: IDateTime;
    only_future?: boolean;
    start_of_week?: number;
    slugline?: string;
    lock_state?: LOCK_STATE;
    directly_locked?: boolean;
    recurrence_id?: string; // Both Events and Planning have recurrence_id
    filter_id?: ISearchFilter['_id'];
    sort_order?: SORT_ORDER;
    sort_field?: SORT_FIELD;
    source?: Array<{
        id?: string;
        name?: string;
    }>;
    coverage_user_id?:string;
    priority?: Array<number>;

    // Event Params
    reference?: string;
    location?: IEventLocation;
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
    coverage_assignment_status?: ICoverageAssigned['qcode'];
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
    time_zone?: string;
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
    lock_state?: LOCK_STATE;
    directly_locked?: boolean;
    recurrence_id?: string;
    filter_id?: ISearchFilter['_id'];
    source?: string;
    coverage_user_id?:string;
    priority?: string;

    // Event Params
    reference?: string;
    location?: IEventLocation['qcode'];
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
    coverage_assignment_status?:ICoverageAssigned['qcode']

    // Combined Params
    include_associated_planning?: boolean;

    // Pagination
    page?: number;
    max_results?: number;
    repo: FILTER_TYPE;
    sort_order?: SORT_ORDER;
    sort_field?: SORT_FIELD;
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

export interface IEditorFieldProps {
    item: any;
    field: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    defaultValue?: any;
    autoFocus?: boolean;
    errors?: {[key: string]: any};
    invalid?: boolean;
    language?: string;
    testId?: string;
    refNode?: React.RefObject<any & IEditorRefComponent>;
    schema?: IProfileSchemaType;
    editor?: IProfileEditorField;
    showErrors?: boolean;
    editorType?: EDITOR_TYPE;
    profile?: IPlanningContentProfile;

    onChange(field: string | {[key: string]: any}, value: any): void;
    popupContainer?(): HTMLElement;
}

export interface IListFieldProps {
    item: any;
    field?: string;
    language?: string;
    schema?: IProfileSchemaType;
    profile?: IPlanningContentProfile;
}

export type IRenderPanelType =
    | 'editor'
    | 'list'
    | 'simple-preview'
    | 'form-preview';

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
    type: 'events' | 'planning' | 'combined';
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

export interface IFieldsProps {
    item: IEventOrPlanningItem;
    language?: string;
}

interface IMainStateSearch<T> {
    lastRequestParams: T;
    fulltext?: string;
    currentSearch?: T;
    totalItems: number;
    jumpInterval: JUMP_INTERVAL;
}

export interface IMainState {
    previewId?: IEventItem['_id'] | IPlanningItem['_id'];
    previewType?: IEventItem['type'] | IPlanningItem['type'];
    listViewType: LIST_VIEW_TYPE;
    loadingPreview: boolean;
    filter?: PLANNING_VIEW;
    loadingIndicator: boolean;
    itemHistory: Array<any>;
    search: {
        EVENTS: IMainStateSearch<IEventSearchParams>;
        PLANNING: IMainStateSearch<IPlanningSearchParams>;
        COMBINED: IMainStateSearch<ICombinedSearchParams>;
    };
}

export interface IAgendaState {
    agendas: Array<IAgenda>;
    currentPlanningId?: IPlanningItem['_id'];
    currentAgendaId?: IAgenda['_id'];
    currentFilterId?: ISearchFilter['_id'];
    agendasAreLoading: boolean;
}

export interface IEventState {
    events: {[key: string]: IEventItem};
    eventsInList: Array<IEventItem['_id']>;
    readOnly: boolean;
    eventHistoryItems: Array<any>;
    calendars: Array<ICalendar>;
    currentCalendarId?: ICalendar['qcode'];
    currentFilterId?: ISearchFilter['_id'];
    eventTemplates: Array<IEventItem>;
    recentEventTemplates?: Array<IEventTemplate['_id']>;
}

export interface IEditorFormState {
    itemId?: IEventOrPlanningItem['_id'];
    itemType?: 'event' | 'planning';
    action?: any;
    initialValues?: DeepPartial<IEventOrPlanningItem>;
    itemHistory?: Array<any>;
    groups?: {[key: string]: IEditorFormGroup};
    bookmarks?: {[key: string]: IEditorBookmark};
    activeBookmarkId?: IEditorBookmark['id'];
    diff?: DeepPartial<IEventOrPlanningItem>;
    popupFormComponent?: React.ComponentClass;
    popupFormProps?: any;
}

export interface IFormState {
    profiles: {[key: string]: IPlanningContentProfile};
    autosaves: {
        event?: DeepPartial<IEventOrPlanningItem>;
        planning?: DeepPartial<IEventOrPlanningItem>;
    };
    editors: {
        panel?: IEditorFormState;
        modal?: IEditorFormState;
    };
}

export interface IPlanningState {
    plannings: {[key: string]: IPlanningItem};
    planningsInList: Array<IPlanningItem['_id']>;
    currentPlanningId?: IPlanningItem['_id'];
    editorOpened?: boolean;
    readOnly?: boolean;
    planningHistoryItems: Array<any>;
    customVocabularies: Array<IVocabulary>;
}

export interface IFeaturedPlanningState {
    currentSearchParams?: ISearchParams;
    plannings: {
        storedItems: {[key: string]: IPlanningItem};
        sortedItemsForDate: Array<IPlanningItem['_id']>;
        unselected: Array<IPlanningItem['_id']>;
        selected: Array<IPlanningItem['_id']>;
        autoRemove: Array<IPlanningItem['_id']>;
    },
    modal: {
        highlights: Array<IPlanningItem['_id']>;
        notifications: Array<string>;
        dirty: boolean;
    };
    currentFeaturedItem?: IFeaturedPlanningItem;
    loading: boolean;
    lock: {
        user?: IUser['_id'];
        session?: string;
    };
    inUse: boolean;
}

export interface IEventsPlanningState {
    eventsAndPlanningInList: Array<IEventOrPlanningItem['_id']>;
    relatedPlannings: {[key: string]: IPlanningItem};
    filters: Array<ISearchFilter>;
    currentFilter?: ISearchFilter['_id'];
}

export interface IPlanningAppState {
    main: IMainState;
    agenda: IAgendaState;
    events: IEventState;
    planning: IPlanningState;
    eventsPlanning: IEventsPlanningState;
    featuredPlanning: IFeaturedPlanningState;
    forms: IFormState;
    session: ISession;
    locks: ILockedItems;
    vocabularies: {[id: string]: Array<IVocabularyItem>};
}

export interface INominatimLocalityFields {
    city?: string;
    state?: string;
    state_district?: string;
    region?: string;
    county?: string;
    island?: string;
    town?: string;
    moor?: string;
    waterways?: string;
    village?: string;
    district?: string;
    borough?: string;
}

export interface INominatimAreaFields {
    state_district?: string;
    island?: string;
    town?: string;
    moor?: string;
    waterways?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    district?: string;
    borough?: string;
    airport?: string;
    national_park?: string;
    suburb?: string;
    croft?: string;
    subdivision?: string;
    farm?: string;
    locality?: string;
    islet?: string;
}

export interface INominatimItem {
    type: string;
    place_id: number;
    osm_type: string;
    osm_id: number;
    lon: string;
    licence: string;
    lat: string;
    importance: number;
    icon: string;
    display_name: string;
    class: string;
    boundingbox: Array<string>;
    extratags: {[key: string]: string};
    namedetails: {
        name: string;
        [key: string]: string
    }; // name translations, i.e. namedetails['name:fr']
    address: INominatimLocalityFields & INominatimAreaFields & {
        continent?: string;

        country?: string;
        country_code?: string;

        // region?: string;
        // state?: string;
        // state_district?: string;
        // county?: string;

        // municipality?: string;
        // city?: string;
        // town?: string;
        // village?: string;

        city_district?: string;
        // district?: string;
        // borough?: string;
        // suburb?: string;
        // subdivision?: string;

        postcode?: string;

        // hamlet?: string;
        // croft?: string;
        isolated_dwelling?: string;

        neighbourhood?: string;
        allotments?: string;
        quarter?: string;

        city_block?: string;
        residental?: string;
        // farm?: string;
        farmyard?: string;
        industrial?: string;
        commercial?: string;
        retail?: string;

        house_number?: string;
        house_name?: string;
        road?: string;

        emergency?: string;
        historic?: string;
        military?: string;
        natural?: string;
        landuse?: string;
        place?: string;
        railway?: string;
        man_made?: string;
        aerialway?: string;
        boundary?: string;
        amenity?: string;
        aeroway?: string;
        club?: string;
        craft?: string;
        leisure?: string;
        office?: string;
        mountain_pass?: string;
        shop?: string;
        tourism?: string;
        bridge?: string;
        tunnel?: string;
        waterway?: string;
        construction?: string;
        // island?: string;
        // moor?: string;
        // waterways?: string;
        // airport?: string;
        // national_park?: string;
        // locality?: string;
        // islet?: string;
        territory?: string;
    };
}

export type IEditorAction = 'read' | 'create' | 'edit';

export interface IEditorState {
    tab: number;
    diff: DeepPartial<IEventOrPlanningItem>;
    errors: {[key: string]: string};
    errorMessages: Array<string>;
    dirty: boolean;
    submitting: boolean;
    submitFailed: boolean;
    partialSave: boolean;
    itemReady: boolean;
    loading: boolean;
    initialValues: DeepPartial<IEventOrPlanningItem>;
    mainLanguage?: IVocabularyItem['qcode'];
    showAllLanguages: boolean;

    // Sidebar navigation
    activeNav?: string; // is this used anymore?
}

export interface IEditorProps {
    item?: IEventOrPlanningItem;
    itemId?: IEventOrPlanningItem['_id'];
    itemType: string;
    itemAction?: IEditorAction;
    session: ISession;
    privileges: IPrivileges;
    lockedItems: ILockedItems;
    users: Array<IUser>;
    addNewsItemToPlanning?: IArticle;
    formProfiles: IFormProfiles;
    occurStatuses: Array<IEventOccurStatus>;
    itemActions: {[key: string]: () => void}; // List of item action dispatches (i.e. Cancel Event)
    showUnlock: boolean;
    hideItemActions: boolean;
    hideMinimize: boolean;
    createAndPost: boolean;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    className?: string;
    contentClassName?: string;
    navigation?: IFormNavigation;
    inModalView: boolean;
    hideExternalEdit: boolean;
    defaultDesk: IDesk;
    preferredCoverageDesks: {[key: string]: string};
    associatedPlannings?: Array<IPlanningItem>;
    associatedEvent?: IEventItem;
    currentWorkspace: string;
    editorType: EDITOR_TYPE;
    groups: Array<IEditorFormGroup>;

    minimize(): void;
    openCancelModal(modalProps: {
        itemId: IEventOrPlanningItem['_id'],
        itemType: string,
        onCancel(): void,
        onIgnore(): void,
        onSave(withConfirmation: boolean, updateMethod: string): void,
        onSaveAndPost(withConfirmation: boolean, updateMethod: string): void
    }): void;
    onChange?(diff: Partial<IEventOrPlanningItem>): void;
    onCancel?(): void;
    notifyValidationErrors(errors: Array<string>): void;
    saveDiffToStore(diff: DeepPartial<IEventOrPlanningItem>): void;
    dispatch: Dispatch;
}

export enum BOOKMARK_TYPE {
    formGroup = 'BOOKMARK_FORM_GROUP',
    divider = 'BOOKMARK_DIVIDER',
    custom = 'BOOKMARK_CUSTOM'
}

export enum EDITOR_TYPE {
    INLINE = 'panel',
    POPUP = 'modal',
}

export interface IEditorBookmarkBase {
    id: string;
    index: number;
    type: BOOKMARK_TYPE;
    disabled?: boolean;
}

export interface IEditorBookmarkDivider extends IEditorBookmarkBase {
    type: BOOKMARK_TYPE.divider;
}

export interface IEditorBookmarkGroup extends IEditorBookmarkBase {
    type: BOOKMARK_TYPE.formGroup;
    name: string;
    tooltip: string;
    icon: string;
    group_id: string;
}

export interface IBookmarkProps {
    bookmark: IEditorBookmark;
    active: boolean;
    editorType: EDITOR_TYPE;
    index: number;
    item?: DeepPartial<IEventOrPlanningItem>;
    readOnly: boolean;
}

export interface IEditorBookmarkCustom extends IEditorBookmarkBase {
    type: BOOKMARK_TYPE.custom;
    component: React.ComponentType<IBookmarkProps>;
}

export type IEditorBookmark = IEditorBookmarkDivider
    | IEditorBookmarkGroup
    | IEditorBookmarkCustom;

export interface IEditorFormGroup {
    id: string;
    index: number;
    icon: string;
    showBookmark?: boolean;
    fields: Array<string>;
    disabled?: boolean;
    useToggleBox?: boolean;
    title?: string;
}

export abstract class IEditorRefComponent {
    abstract scrollIntoView(): void;
    abstract getBoundingClientRect(): DOMRect | undefined;
    abstract focus(): void;
}

export abstract class IEditorHeaderComponent {
    abstract unregisterKeyBoardShortcuts(): void;
}

export interface IWebsocketMessageData {
    ITEM_UNLOCKED: {
        item: IEventOrPlanningItem['_id'];
        etag: IEventOrPlanningItem['_etag'];
        from_ingest: boolean;
        user?: IEventOrPlanningItem['lock_user'];
        lock_session?: IEventOrPlanningItem['lock_session'];
        recurrence_id?: IEventItem['recurrence_id'];
        event_item?: IEventItem['_id'];
        type: IEventOrPlanningItem['type'] | IAssignmentItem['type'];
    };
    ITEM_LOCKED: {
        item: IEventOrPlanningItem['_id'];
        etag: IEventOrPlanningItem['_etag'];
        user: IEventOrPlanningItem['lock_user'];
        lock_session: IEventOrPlanningItem['lock_session'];
        lock_action: IEventOrPlanningItem['lock_action'];
        lock_time: IEventOrPlanningItem['lock_time'];
        recurrence_id?: IEventOrPlanningItem['recurrence_id'];
        type: IEventOrPlanningItem['type'] | IAssignmentItem['type'];
        event_item?: IEventItem['_id'];
    };
}

export interface IEditorAPI {
    ready: boolean;
    events: {
        onEditorConstructed(manager: IFormItemManager, autosave: IFormAutosave): void;
        onEditorMounted(manager: IFormItemManager, autosave: IFormAutosave): void;
        onEditorUnmounted(): void;
        onEditorFormMounted(): void;
        onEditorClosed(): void;

        onOpenForCreate(newState: Partial<IEditorState>): void;
        onOpenForEdit(newState: Partial<IEditorState>): void;
        onOpenForRead(newState: Partial<IEditorState>): void;
        onOriginalChanged(item: IEventOrPlanningItem): void;
        onItemUpdated(newState: Partial<IEditorState>): void;

        onScroll(): void;
        beforeFormUpdates(newState: Partial<IEditorState>, field: string, value: string): void;
    };
    dom: {
        popupContainer: React.RefObject<HTMLDivElement>;
        editorContainer: React.RefObject<any>;
        headerInstance: React.RefObject<any & IEditorHeaderComponent>;
        formContainer: React.RefObject<HTMLDivElement>;
        groups: {[key: string]: React.RefObject<any & IEditorRefComponent>};
        fields: {[key: string]: React.RefObject<any & IEditorRefComponent>};
    };
    form: {
        getProps(): IEditorProps;
        setState(newState: Partial<IEditorState>): Promise<IEditorState>;
        getState(): IEditorState;
        getDiff<T extends IEventOrPlanningItem>(): DeepPartial<T>;
        changeField(
            field: string,
            value: any,
            updateDirtyFlag?: boolean,
            saveAutosave?: boolean
        ): Promise<void>;

        scrollToTop(): void;
        scrollToBookmarkGroup(bookmarkId: IEditorBookmarkGroup['group_id']): void;
        waitForScroll(): Promise<void>;

        getAction(): IEditorAction;
        isReadOnly(): boolean;

        showPopupForm(component: React.ComponentClass, props: any): Promise<any>;
        closePopupForm(): void;
        getMainLanguage(): IVocabularyItem['qcode'];
        setMainLanguage(languageQcode?: IVocabularyItem['qcode']): void;
        toggleAllLanguages(): void;
    };
    manager?: IFormItemManager; // Older Form API
    autosave?: IFormAutosave; // Form Autosave
    item: {
        getItemType(): string;
        getItemId(): IEventOrPlanningItem['_id'];
        getAssociatedPlannings(): Array<IPlanningItem>;
        events: {
            getGroupsForItem(item: Partial<IEventItem>): {
                bookmarks: Array<IEditorBookmark>;
                groups: Array<IEditorFormGroup>;
            };
            getRelatedPlanningDomRef(planId: IPlanningItem['_id']): React.RefObject<any>;
            addPlanningItem(): void;
            removePlanningItem(item: DeepPartial<IPlanningItem>): void;
            updatePlanningItem(
                original: DeepPartial<IPlanningItem>,
                updates: DeepPartial<IPlanningItem>,
                scrollOnChange: boolean
            ): void;
            addCoverageToWorkflow(original: IPlanningItem, coverage: IPlanningCoverageItem, index: number): void;
            onEventDatesChanged(updates: Partial<IEventItem['dates']>): void;
        };
        planning: {
            getGroupsForItem(item: Partial<IPlanningItem>): {
                bookmarks: Array<IEditorBookmark>;
                groups: Array<IEditorFormGroup>;
            };
            getCoverageFields(): ISearchProfile;
            getCoverageFieldDomRef(coverageId: IPlanningCoverageItem['coverage_id']): React.RefObject<any>;
            addCoverages(coverages: Array<DeepPartial<IPlanningCoverageItem>>): void;
        };
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
        getEditorProfile(): IEventFormProfile;
        getSearchProfile(): IEventSearchProfile;
        create(updates: Partial<IEventItem>): Promise<Array<IEventItem>>;
        update(original: IEventItem, updates: Partial<IEventItem>): Promise<Array<IEventItem>>;
    };
    planning: {
        search(params: ISearchParams): Promise<IRestApiResponse<IPlanningItem>>;
        searchGetAll(params: ISearchParams): Promise<Array<IPlanningItem>>;
        getById(planId: IPlanningItem['_id'], saveToStore?: boolean, force?: boolean): Promise<IPlanningItem>;
        getByIds(
            planIds: Array<IPlanningItem['_id']>,
            spikeState?: ISearchSpikeState,
            params?: ISearchParams
        ): Promise<Array<IPlanningItem>>;
        getEditorProfile(): IPlanningFormProfile;
        getSearchProfile(): IPlanningSearchProfile;
        featured: {
            getById(id: string): Promise<IFeaturedPlanningItem>;
            getByDate(date: moment.Moment): Promise<IFeaturedPlanningItem>;
            save(updates: Partial<IFeaturedPlanningItem>): Promise<IFeaturedPlanningItem>;
        };
        coverages: {
            setDefaultValues(
                item: DeepPartial<IPlanningItem>,
                event?: IEventItem,
                g2contentType?: IG2ContentType['qcode']
            ): DeepPartial<IPlanningCoverageItem>;
            addCoverageToWorkflow(
                plan: IPlanningItem,
                coverage: IPlanningCoverageItem,
                index: number
            ): Promise<IPlanningItem>;
        }
        create(updates: Partial<IPlanningItem>): Promise<IPlanningItem>;
        update(original: IPlanningItem, updates: Partial<IPlanningItem>): Promise<IPlanningItem>;
        createFromEvent(event: IEventItem, updates: Partial<IPlanningItem>): Promise<IPlanningItem>;
    };
    assignments: {
        getById(assignmentId: IAssignmentItem['_id']): Promise<IAssignmentItem>;
    };
    coverages: {
        getEditorProfile(): ICoverageFormProfile;
    };
    combined: {
        search(params: ISearchParams): Promise<IRestApiResponse<IEventOrPlanningItem>>;
        searchGetAll(params: ISearchParams): Promise<Array<IEventOrPlanningItem>>;
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
    vocabularies: {
        getCustomVocabularies(): Array<IVocabulary>;
    };
    search<T>(args: ISearchAPIParams): Promise<IRestApiResponse<T>>;
    ui: {
        list: {
            changeFilterId(id: ISearchFilter['_id'], params?: ICombinedEventOrPlanningSearchParams): Promise<any>;
            changeCalendarId(id: ICalendar['qcode'], params?: IEventSearchParams): Promise<any>;
            changeAgendaId(id: IAgenda['_id'], params?: IPlanningSearchParams): Promise<any>;
            search(params: ISearchParams): Promise<any>;
            clearSearch(): Promise<any>;
            clearList(): void;
            setViewType(viewType: LIST_VIEW_TYPE): Promise<any>;
            changeCurrentView(view: PLANNING_VIEW): Promise<any>;
        };
    };
    locations: {
        create(location: Partial<ILocation>): Promise<ILocation>;
        getOrCreate(location: Partial<ILocation>): Promise<ILocation>;
        update(original: ILocation, updates: Partial<ILocation>): Promise<ILocation>;
        delete(location: ILocation): Promise<void>;
        closeEditor(): void;

        getByUniqueName(name: string): Promise<ILocation | undefined>;
        browse(searchText: string, page?: number): Promise<IRestApiResponse<ILocation>>;
        search(searchText?: string, page?: number): Promise<IRestApiResponse<ILocation>>;

        searchExternal(searchText: string, language?: string): Promise<Array<Partial<ILocation>>>;
        reloadList(): void;
    };
    autosave: {
        getById(
            type: IEventOrPlanningItem['type'],
            id: IEventOrPlanningItem['_id']
        ): Promise<IEventOrPlanningItem | null>;
        save(
            original: IEventOrPlanningItem | undefined,
            updates: Partial<IEventOrPlanningItem>
        ): Promise<IEventOrPlanningItem>;
        delete(item: IEventOrPlanningItem): Promise<void>;
        deleteById(itemType: IEventOrPlanningItem['type'], itemId: IEventOrPlanningItem['_id']): Promise<void>;
    };
    editor(type: EDITOR_TYPE): IEditorAPI;
    contentProfiles: {
        getAll(): Promise<Array<IPlanningContentProfile>>;
        get(contentType: string): IPlanningContentProfile;
        multilingual: {
            getLanguageSchema(profile: IPlanningContentProfile): IProfileSchemaTypeString
            isEnabled(profile: IPlanningContentProfile): boolean;
            getLanguages(profile: IPlanningContentProfile): Array<IVocabularyItem['qcode']>;
            getFields(profile: IPlanningContentProfile): Array<keyof IEventOrPlanningItem>;
            getConfig(contentType: string): IProfileMultilingualDetails;
        };
        getDefaultLanguage(profile: IPlanningContentProfile): IVocabularyItem['qcode'];
        getDefaultValues(profile: IPlanningContentProfile): DeepPartial<IEventOrPlanningItem | IPlanningCoverageItem>;
        patch(original: IPlanningContentProfile, updates: IPlanningContentProfile): Promise<IPlanningContentProfile>;
        showManagePlanningProfileModal(): Promise<void>;
        showManageEventProfileModal(): Promise<void>;
        updateProfilesInStore(): Promise<void>;
    };
    locks: {
        loadLockedItems(types?: Array<'events_and_planning' | 'featured_planning' | 'assignments'>): Promise<void>;
        setItemAsLocked(data: IWebsocketMessageData['ITEM_LOCKED']): void;
        setItemAsUnlocked(data: IWebsocketMessageData['ITEM_UNLOCKED']): void;
        lockItem<T extends IAssignmentOrPlanningItem>(item: T, action: string): Promise<T>;
        lockItemById<T extends IAssignmentOrPlanningItem>(
            itemId: T['_id'],
            itemType: T['type'],
            action: string
        ): Promise<T>;
        unlockItem<T extends IAssignmentOrPlanningItem>(item: T): Promise<T>;
        unlockItemById<T extends IAssignmentOrPlanningItem>(itemId: T['_id'], itemType: T['type']): Promise<T>;
        unlockThenLockItem<T extends IAssignmentOrPlanningItem>(item: T, action: string): Promise<T>;
        lockFeaturedPlanning(): Promise<void>;
        unlockFeaturedPlanning(): Promise<void>;
    };
}

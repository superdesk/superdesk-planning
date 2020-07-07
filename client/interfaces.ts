import {ITEM_STATE, ISuperdeskGlobalConfig} from 'superdesk-api';

export type IPlanningNewsCoverageStatus = {
    qcode: 'ncostat:int' | 'ncostat:notdec' | 'ncostat:notint' | 'ncostat:onreq';
    name: string;
    label: string;
};

export type IPlanningWorkflowStatus = 'assigned' | 'in_progress' | 'completed' | 'submitted' | 'cancelled' | 'reverted';
export type IPlanningPubstatus = 'usable' | 'cancelled';

export type IPlanningAssignedTo = {
    assignment_id: string;
    state: string;
    contact: string;
};

export type IEventUpdateMethod = 'single' | 'future' | 'all';

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
    };
}


// The Event, Planning and Coverage interfaces were directly derived from the schema on the Server
export interface IEventItem {
    _id: string;
    guid: string;
    unique_id: string;
    unique_name: string;
    version: number;
    ingest_id: string;
    recurrence_id: string;
    previous_recurrence_id: string;
    original_creator: string;
    version_creator: string;
    firstcreated: string;
    versioncreated: string;
    ingest_provider: string;
    source: string;
    original_source: string;
    ingest_provider_sequence: string;
    event_created: string | Date;
    event_lastmodified: string | Date;
    name: string;
    definition_short: string;
    definition_long: string;
    internal_note: string;
    anpa_category: Array<{
        qcode: string;
        name: string;
    }>;
    files: Array<File | string>;
    relationships: {
        broader: string;
        narrower: string;
        related: string;
    }
    links: Array<string>;
    dates: {
        start: string | Date;
        end: string | Date;
        tz: string;
        duration: string;
        confirmation: string;
        recurring_date: Array<Date>;
        recurring_rule: {
            frequency: string;
            interval: number;
            endRepeatMode: 'count' | 'until';
            until: string | Date;
            count: number;
            bymonth: string;
            byday: string;
            byhour: string;
            byminute: string;
        };
        occur_status: {
            qcode: string;
            name: string;
        };
        ex_date: Array<Date>;
        ex_rule: {
            frequency: string;
            interval: string;
            until: string | Date;
            bymonth: string;
            byday: string;
            byhour: string;
            byminute: string;
        }
    };
    _planning_schedule: Array<{
        scheduled: string | Date;
    }>;
    occur_status: {
        qcode: string;
        name: string;
        label: string;
    };
    news_coverage_status: {
        qcode: string;
        name: string;
    };
    registration: string;
    access_status: Array<{
        qcode: string;
        name: string;
    }>;
    subject: Array<{
        qcode: string;
        name: string;
    }>;
    slugline: string;
    location: Array<{
        qcode: string;
        name: string;
        address: string;
        geo: string;
        location: string;
    }>;
    participant: Array<{
        qcode: string;
        name: string;
    }>;
    participant_requirement: Array<{
        qcode: string;
        name: string;
    }>;
    organizer: Array<{
        qcode: string;
        name: string;
    }>;
    event_contact_info: Array<string>;
    event_language: Array<{
        qcode: string;
        name: string;
    }>;
    state: ITEM_STATE;
    expiry: string | Date;
    expired: boolean;
    pubstatus: IPlanningPubstatus;
    lock_user: string;
    lock_time: string | Date;
    lock_session: string;
    lock_action: string;
    update_method: IEventUpdateMethod;
    type: string;
    calendars: Array<{
        qcode: string;
        name: string;
    }>;
    revert_state: ITEM_STATE;
    duplicate_from: string;
    duplicate_to: Array<string>;
    reschedule_from: string;
    reschedule_to: string;
    _reschedule_from_schedule: string | Date;
    place: Array<IPlace>;
    ednote: string;
    state_reason: string;
    actioned_date: string | Date;
    completed: boolean;
    _time_to_be_confirmed: boolean;
    _planning_item: string;
    template: string;
}

export interface IPlanningCoverageItem {
    coverage_id: string;
    guid: string;
    original_creator: string;
    version_creator: string;
    firstcreated: string;
    versioncreated: string;

    planning: {
        ednote: string;
        g2_content_type: string;
        coverage_provider: string;
        contact_info: string;
        item_class: string;
        item_count: string;
        scheduled: string | Date;
        files: Array<File | string>;
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
        genre: Array<{
            qcode: string;
            name: string;
        }>;
        headline: string;
        keyword: Array<string>;
        language: Array<string>;
        slugline: string;
        internal_note: string;
        workflow_status_reason: string;
    };

    news_coverage_status: IPlanningNewsCoverageStatus;
    workflow_status: IPlanningWorkflowStatus;
    previous_status: IPlanningWorkflowStatus;
    assigned_to: IPlanningAssignedTo;
    flags: {
        no_content_linking: boolean;
    };
    _time_to_be_confirmed: boolean;
    scheduled_updates: Array<{
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
    }>;
}

export interface IPlanningItem {
    _id: string;
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
    anpa_category: Array<{
        qcode: string;
        name: string;
    }>;
    subject: Array<{
        qcode: string;
        name: string;
    }>;
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
    files: Array<File | string>;
    state_reason: string;
    reason: string;
    _time_to_be_confirmed: boolean;
    _cancelAllCoverage: boolean;
}

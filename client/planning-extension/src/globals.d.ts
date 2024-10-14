
declare const angular: IAngularStatic;

type DeepPartial<T> = {
    [K in keyof T]?: DeepPartial<T[K]>;
}

// KEEP IN SYNC WITH client/globals.d.ts
declare module 'superdesk-api' {
    interface ISuperdeskGlobalConfig {
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
        start_of_week?: number;
        planning_default_view: PLANNING_VIEW;

        planning?: {
            dateformat?: string;
            timeformat?: string;
            allowed_coverage_link_types?: Array<string>;
            autosave_timeout?: number;
            default_create_planning_series_with_event_series?: boolean;
            event_related_item_search_provider_name?: string;
        };

        coverage?: {
            getDueDateStrategy?(planningItem: IPlanningItem, eventItem?: IEventItem): moment.Moment | null;
        };
    }
}
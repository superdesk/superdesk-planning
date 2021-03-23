import moment from 'moment-timezone';

import {IPlanningConfig} from './interfaces';
import {appConfig} from 'appConfig';

appConfig = appConfig as IPlanningConfig;

// Set the default values for Planning config entries

if (appConfig.default_genre == null) {
    appConfig.default_genre = [{qcode: 'Article', name: 'Article (news)'}];
}

if (appConfig.max_recurrent_events == null) {
    appConfig.max_recurrent_events = 200;
}

if (appConfig.street_map_url == null) {
    appConfig.street_map_url = 'https://www.google.com.au/maps/?q=';
}

if (appConfig.planning_auto_assign_to_workflow == null) {
    appConfig.planning_auto_assign_to_workflow = false;
}

if (appConfig.long_event_duration_threshold == null) {
    appConfig.long_event_duration_threshold = -1;
}

if (appConfig.defaultTimezone == null) {
    appConfig.defaultTimezone = moment.tz.guess();
}

if (appConfig.max_multi_day_event_duration == null) {
    appConfig.max_multi_day_event_duration = 0;
}

if (appConfig.planning_allow_freetext_location == null) {
    appConfig.planning_allow_freetext_location = false;
}

if (appConfig.planning_allow_scheduled_updates == null) {
    appConfig.planning_allow_scheduled_updates = false;
}

if (appConfig.planning_use_xmp_for_pic_assignments == null) {
    appConfig.planning_use_xmp_for_pic_assignments = false;
}

if (appConfig.planning_use_xmp_for_pic_slugline == null) {
    appConfig.planning_use_xmp_for_pic_slugline = false;
}

if (appConfig.planning_xmp_assignment_mapping == null) {
    appConfig.planning_xmp_assignment_mapping = '';
}

if (appConfig.event_templates_enabled == null) {
    appConfig.event_templates_enabled = false;
}

if (appConfig.planning_fulfil_on_publish_for_desks == null) {
    appConfig.planning_fulfil_on_publish_for_desks = [];
}

if (appConfig?.planning_auto_close_popup_editor == null) {
    appConfig.planning_auto_close_popup_editor = true;
}

// Configured start of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
if (appConfig.start_of_week == null) {
    appConfig.start_of_week = 0;
} else if (typeof appConfig.start_of_week === 'string') {
    appConfig.start_of_week = parseInt(appConfig.start_of_week, 10);
}

if (appConfig.planning == null) {
    appConfig.planning = {};
}

export function updateConfigAfterLoad() {
    if (appConfig?.planning?.dateformat == null) {
        appConfig.planning.dateformat = appConfig.view.dateformat;
    }

    if (appConfig?.planning?.timeformat == null) {
        appConfig.planning.timeformat = 'HH:mm';
    }

    if (appConfig?.planning?.allowed_coverage_link_types == null) {
        appConfig.planning.allowed_coverage_link_types = [];
    }

    if (appConfig?.planning?.autosave_timeout == null) {
        appConfig.planning.autosave_timeout = 1500;
    }
}

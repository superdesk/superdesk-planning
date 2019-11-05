import {get} from 'lodash';
import moment from 'moment-timezone';
import {createSelector} from 'reselect';

import {coverageProfile} from './forms';

export const getDateFormat = (state) =>
    get(state, 'config.view.dateformat') ||
    get(state, 'config.model.dateformat');

export const getTimeFormat = (state) =>
    get(state, 'config.view.timeformat') ||
    get(state, 'config.shortTimeFormat');

export const getMaxRecurrentEvents = (state) =>
    get(state, 'deployConfig.max_recurrent_events', 200);

export const getDefaultGenre = (state) =>
    get(state, 'deployConfig.default_genre', [{}])[0];

export const getServerUrl = (state) => get(state, 'config.server.url');

export const getStreetMapUrl = (state) =>
    get(state, 'deployConfig.street_map_url', 'https://www.google.com.au/maps/?q=');

export const getAutoAssignToWorkflow = (state) => get(state, 'deployConfig.planning_auto_assign_to_workflow');

export const getLongEventDurationThreshold = (state) => get(state, 'deployConfig.long_event_duration_threshold');

export const getDeployConfig = (state) => get(state, 'deployConfig');

export const getStartOfWeek = (state) =>
    parseInt(get(state, 'config.startingDay', 0), 10);

export const getIframelyKey = (state) => get(state, 'config.iframely.key', null);

export const defaultTimeZone = (state) => get(state, 'config.defaultTimezone', moment.tz.guess());

export const getMaxMultiDayEventDuration = (state) => get(state, 'deployConfig.max_multi_day_event_duration', 0);

export const allowFreeTextLocation = (state) => get(state, 'config.planning_allow_freetext_location', false);

export const planningAllowScheduledUpdates = (state) => get(state, 'deployConfig.planning_allow_scheduled_updates',
    false);

export const getPlanningAllowScheduledUpdates = createSelector([coverageProfile, planningAllowScheduledUpdates],
    (cp, allowScheduleUpdates) => get(cp, 'editor.flags') && allowScheduleUpdates);

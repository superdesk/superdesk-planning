import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment-timezone';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../superdeskApi';

import {
    getItemWorkflowStateLabel,
    getItemInArrayById,
    planningUtils,
} from '../../utils';
import {TO_BE_CONFIRMED_FIELD} from '../../constants';

export const CoverageIcon = ({
    coverage,
    users,
    desks,
    contentTypes,
    contacts,
}) => {
    const {gettext} = superdeskApi.localization;
    const user = getItemInArrayById(users, get(coverage, 'assigned_to.user'));
    const desk = getItemInArrayById(desks, get(coverage, 'assigned_to.desk'));
    const dateFormat = appConfig.planning.dateformat;
    const timeFormat = appConfig.planning.timeformat;
    let provider = get(coverage, 'assigned_to.coverage_provider.name');

    if (get(coverage, 'assigned_to.contact') && get(contacts, coverage.assigned_to.contact)) {
        const contact = contacts[coverage.assigned_to.contact];

        provider = contact.first_name ?
            `${contact.last_name}, ${contact.first_name}` :
            contact.organisation;
    }

    const assignmentStr = desk ?
        gettext('Desk: {{ desk }}', {desk: desk.name}) :
        gettext('Status: Unassigned');
    let scheduledStr = get(coverage, 'planning.scheduled') && dateFormat && timeFormat ?
        moment(coverage.planning.scheduled).format(dateFormat + ' ' + timeFormat) : null;

    if (get(coverage, TO_BE_CONFIRMED_FIELD)) {
        scheduledStr = moment(coverage.planning.scheduled).format(dateFormat + ` @ ${gettext('TBC')}`);
    }
    const state = getItemWorkflowStateLabel(get(coverage, 'assigned_to'));
    const genre = get(coverage, 'planning.genre.name', '');
    const slugline = get(coverage, 'planning.slugline', '');

    return (
        <OverlayTrigger
            placement="bottom"
            overlay={(
                <Tooltip id={coverage.coverage_id} className="tooltip--text-left">
                    {!desk ? null : (
                        <span>
                            {gettext('Status: {{ state }}', {state: state.label})}<br />
                        </span>
                    )}
                    {assignmentStr}
                    {!user ? null : (
                        <span>
                            <br />{gettext('User: {{ user }}', {user: user.display_name})}
                        </span>
                    )}
                    {!provider ? null : (
                        <span>
                            <br />{gettext('Provider: {{ provider }}', {provider: provider})}
                        </span>
                    )}
                    {!genre ? null : (
                        <span>
                            <br />{gettext('Genre: {{ genre }}', {genre: genre})}
                        </span>
                    )}
                    {!slugline ? null : (
                        <span>
                            <br />{gettext('Slugline: {{ slugline }}', {slugline: slugline})}
                        </span>
                    )}
                    {!scheduledStr ? null : (
                        <span>
                            <br />{gettext('Due: {{ date }}', {date: scheduledStr})}
                        </span>
                    )}
                    {(get(coverage, 'scheduled_updates') || []).map((s) => {
                        if (get(s, 'planning.scheduled')) {
                            scheduledStr = dateFormat && timeFormat ?
                                moment(s.planning.scheduled).format(dateFormat + ' ' + timeFormat) :
                                null;
                            return (
                                <span>
                                    <br />{gettext('Update Due: {{ date }}', {date: scheduledStr})}
                                </span>
                            );
                        }

                        return null;
                    })}
                </Tooltip>
            )}
        >
            <span className="sd-list-item__inline-icon icn-mix sd-list-item__item-type">
                <i
                    className={classNames(
                        planningUtils.getCoverageWorkflowIcon(coverage),
                        'icn-mix__sub-icn',
                        'icn-mix__sub-icn--gray'
                    )}
                />
                <i
                    className={classNames(
                        planningUtils.getCoverageIcon(
                            planningUtils.getCoverageContentType(coverage, contentTypes) ||
                        get(coverage, 'planning.g2_content_type'), coverage
                        ),
                        planningUtils.getCoverageIconColor(coverage),
                        'sd-list-item__inline-icon'
                    )}
                />
            </span>
        </OverlayTrigger>
    );
};

CoverageIcon.propTypes = {
    coverage: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    contentTypes: PropTypes.array,
    contacts: PropTypes.object,
};

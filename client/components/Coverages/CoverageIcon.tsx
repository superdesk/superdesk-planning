import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment-timezone';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {appConfig} from 'appConfig';

import {
    getItemWorkflowStateLabel,
    getItemInArrayById,
    gettext,
    planningUtils,
} from '../../utils';
import {TO_BE_CONFIRMED_FIELD, TO_BE_CONFIRMED_SHORT_TEXT} from '../../constants';

export const CoverageIcon = ({
    coverage,
    users,
    desks,
    contentTypes,
    contacts,
}) => {
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

    const assignmentStr = desk ? gettext('Desk: ') + desk.name : gettext('Status: Unassigned');
    let scheduledStr = get(coverage, 'planning.scheduled') && dateFormat && timeFormat ?
        moment(coverage.planning.scheduled).format(dateFormat + ' ' + timeFormat) : null;

    if (get(coverage, TO_BE_CONFIRMED_FIELD)) {
        scheduledStr = moment(coverage.planning.scheduled).format(dateFormat + ` @ ${TO_BE_CONFIRMED_SHORT_TEXT}`);
    }
    const state = getItemWorkflowStateLabel(get(coverage, 'assigned_to'));
    const genre = get(coverage, 'planning.genre.name', '');
    const slugline = get(coverage, 'planning.slugline', '');

    return (
        <OverlayTrigger
            placement="bottom"
            overlay={(
                <Tooltip id={coverage.coverage_id} className="tooltip--text-left">
                    {desk && <span>{gettext('Status: ') + state.label}<br /></span>}
                    {assignmentStr}
                    {user && <span><br />{gettext('User: ') + user.display_name}</span>}
                    {provider && <span><br />{gettext('Provider: ') + provider}</span>}
                    {genre && <span><br />{gettext('Genre: ') + genre}</span>}
                    {slugline && <span><br />{gettext('Slugline: ') + slugline}</span>}
                    {scheduledStr && <span><br />{gettext('Due: ') + scheduledStr}</span>}
                    {(get(coverage, 'scheduled_updates') || []).map((s) => {
                        if (get(s, 'planning.scheduled')) {
                            scheduledStr = dateFormat && timeFormat ?
                                moment(s.planning.scheduled).format(dateFormat + ' ' + timeFormat) : null;
                            return (<span><br />{gettext('Update Due: ') + scheduledStr}</span>);
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

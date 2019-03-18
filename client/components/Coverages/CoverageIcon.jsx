import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment-timezone';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';


import {
    getItemWorkflowStateLabel,
    getItemInArrayById,
    gettext,
    planningUtils,
} from '../../utils';

export const CoverageIcon = ({
    coverage,
    users,
    desks,
    timeFormat,
    dateFormat,
    contentTypes,
}) => {
    const user = getItemInArrayById(users, get(coverage, 'assigned_to.user'));
    const desk = getItemInArrayById(desks, get(coverage, 'assigned_to.desk'));
    const assignmentStr = desk ? gettext('Desk: ') + desk.name : gettext('Status: Unassigned');
    const scheduledStr = get(coverage, 'planning.scheduled') && dateFormat && timeFormat ?
        moment(coverage.planning.scheduled).format(dateFormat + ' ' + timeFormat) : null;
    const state = getItemWorkflowStateLabel(get(coverage, 'assigned_to'));
    const genre = get(coverage, 'planning.genre.name', '');
    const slugline = get(coverage, 'planning.slugline', '');

    return (<OverlayTrigger
        placement="bottom"
        overlay={
            <Tooltip id={coverage.coverage_id} className="tooltip--text-left">
                {desk && <span>{gettext('Status: ') + state.label}<br /></span>}
                {assignmentStr}
                {user && <span><br />{gettext('User: ') + user.display_name}</span>}
                {genre && <span><br />{gettext('Genre: ') + genre}</span>}
                {slugline && <span><br />{gettext('Slugline: ') + slugline}</span>}
                {scheduledStr && <span><br />{gettext('Due: ') + scheduledStr}</span>}
            </Tooltip>
        }>
        <span className="sd-list-item__inline-icon icn-mix sd-list-item__item-type">
            <i className={classNames(
                planningUtils.getCoverageWorkflowIcon(coverage),
                'icn-mix__sub-icn',
                'icn-mix__sub-icn--gray')} />
            <i className={classNames(
                planningUtils.getCoverageIcon(
                    planningUtils.getCoverageContentType(coverage, contentTypes) ||
                        get(coverage, 'planning.g2_content_type')),
                planningUtils.getCoverageIconColor(coverage),
                'sd-list-item__inline-icon')}/>
        </span>
    </OverlayTrigger>);
};

CoverageIcon.propTypes = {
    coverage: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    contentTypes: PropTypes.array,
};

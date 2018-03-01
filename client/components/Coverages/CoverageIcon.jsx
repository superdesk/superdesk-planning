/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment-timezone';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';


import {
    getItemInArrayById,
    gettext,
    planningUtils
} from '../../utils';

export const CoverageIcon = ({
    coverage,
    withTooltip,
    users,
    desks,
    timeFormat,
    withoutTime,
}) => {
    let user, desk, assignmentStr;

    const getIcon = () => (
        <span className="sd-list-item__inline-icon icn-mix sd-list-item__item-type">
            <i className={classNames(
                planningUtils.getCoverageWorkflowIcon(coverage),
                'icn-mix__sub-icn',
                'icn-mix__sub-icn--gray')} />
            <i className={classNames(
                planningUtils.getCoverageIcon(get(coverage, 'planning.g2_content_type')),
                planningUtils.getCoverageIconColor(coverage),
                'sd-list-item__inline-icon')}/>
        </span>
    );

    if (withTooltip) {
        user = getItemInArrayById(users, get(coverage, 'assigned_to.user'));
        desk = getItemInArrayById(desks, get(coverage, 'assigned_to.desk'));
        assignmentStr = desk ? 'Desk: ' + desk.name : 'Unassigned';

        return (<OverlayTrigger
            placement="bottom"
            overlay={
                <Tooltip id={coverage.coverage_id}>
                    {gettext(assignmentStr)}
                    {user && <span><br />{gettext('User: ' + user.display_name)}</span>}
                    {!withoutTime && <span><br />Due: {moment(coverage.planning.scheduled).format(timeFormat)}</span>}
                </Tooltip>
            }>
            {getIcon()}
        </OverlayTrigger>);
    }

    return getIcon();
};

CoverageIcon.propTypes = {
    coverage: PropTypes.object,
    withTooltip: PropTypes.bool,
    withoutTime: PropTypes.bool,
    users: PropTypes.array,
    desks: PropTypes.array,
    timeFormat: PropTypes.string,
};

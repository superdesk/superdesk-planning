import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {get} from 'lodash';
import moment from 'moment';

import {getCoverageIcon, planningUtils, getItemInArrayById, gettext} from '../../utils/index';

export const PlanningDateTime = ({item, date, timeFormat, users, desks}) => {
    const coverages = get(item, 'coverages', []);
    const coveragesTypes = planningUtils.mapCoverageByDate(coverages);

    let coveragesToDisplay = [];
    let coveragesWithoutTimes = [];

    coveragesTypes
        .filter((coverage) => {
            const scheduled = get(coverage, 'planning.scheduled');

            if (scheduled && moment(scheduled).format('YYYY-MM-DD') === date) {
                return true;
            }

            coveragesWithoutTimes.push(coverage);
            return false;
        })
        .forEach((coverage) => {
            let scheduled = get(coverage, 'planning.scheduled');

            if (!scheduled) {
                return;
            }

            if (moment(scheduled).format('YYYY-MM-DD') !== date) {
                return;
            }

            coveragesToDisplay.push(coverage);
        });

    const getCoverageElement = (coverage, i, withoutTime = false) => {
        const user = getItemInArrayById(users, get(coverage, 'assigned_to.user'));
        const desk = getItemInArrayById(desks, get(coverage, 'assigned_to.desk'));
        const timeSuffix = withoutTime ? null :
            (<span key={1}>: {moment(coverage.planning.scheduled).format(timeFormat)} </span>);
        const assignmentStr = desk ? 'Desk: ' + desk.name : 'Unassigned';

        return ([<OverlayTrigger
            key={0}
            placement="bottom"
            overlay={
                <Tooltip id={i}>
                    {gettext(assignmentStr)}
                    <br />
                    {user && gettext('User: ' + user.display_name)}
                </Tooltip>
            }>
            <i
                className={classNames(
                    getCoverageIcon(coverage.g2_content_type),
                    coverage.iconColor,
                    {'sd-list-item__inline-icon': withoutTime}
                )} />
        </OverlayTrigger>, timeSuffix]);
    };

    return (
        <span className="sd-no-wrap">
            {coveragesToDisplay.map((coverage, i) => getCoverageElement(coverage, i))}
            {coveragesWithoutTimes.map((coverage, i) => (getCoverageElement(coverage, i, true)))}
        </span>
    );
};

PlanningDateTime.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    users: PropTypes.array,
    desks: PropTypes.array,
};

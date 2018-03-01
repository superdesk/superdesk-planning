import React from 'react';
import PropTypes from 'prop-types';


import {get} from 'lodash';
import moment from 'moment';

import {planningUtils} from '../../utils/index';
import {CoverageIcon} from '../Coverages/';

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

    return (
        <span className="sd-no-wrap">
            {coveragesToDisplay.map((coverage, i) =>
                <CoverageIcon
                    key={i}
                    users={users}
                    desks={desks}
                    timeFormat={timeFormat}
                    coverage={coverage}
                    withTooltip={true} />
            )}
            {coveragesWithoutTimes.map((coverage, i) =>
                <CoverageIcon
                    key={i}
                    users={users}
                    desks={desks}
                    timeFormat={timeFormat}
                    coverage={coverage}
                    withTooltip={true}
                    withoutTime={true} />)}
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

import React from 'react';
import PropTypes from 'prop-types';


import {get} from 'lodash';
import moment from 'moment';

import {planningUtils} from '../../utils/index';
import {MAIN} from '../../constants';
import {CoverageIcon} from '../Coverages/';

export const PlanningDateTime = ({item, date, timeFormat, dateFormat, users, desks, activeFilter}) => {
    const coverages = get(item, 'coverages', []);
    const coverageTypes = planningUtils.mapCoverageByDate(coverages);
    const hasAssociatedEvent = !!get(item, 'event_item');
    const coverageToDisplay = coverageTypes.filter((coverage) => {
        const scheduled = get(coverage, 'planning.scheduled');

        if (activeFilter === MAIN.FILTERS.COMBINED) {
            // Display if it has an associated event or if adhoc planning has coverage on that date
            if (hasAssociatedEvent ||
                (scheduled && moment(scheduled).format('YYYY-MM-DD') === date)) {
                return true;
            }
        } else if (scheduled && moment(scheduled).format('YYYY-MM-DD') === date) {
            // Planning-only view - display only coverage of the particular date
            return true;
        }

        return false;
    });

    return (
        <span className="sd-no-wrap">
            {coverageToDisplay.map((coverage, i) =>
                <CoverageIcon
                    key={i}
                    users={users}
                    desks={desks}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    coverage={coverage} />
            )}
        </span>
    );
};

PlanningDateTime.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,
    users: PropTypes.array,
    desks: PropTypes.array,
    activeFilter: PropTypes.string,
};

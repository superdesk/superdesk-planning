import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import moment from 'moment';

import {planningUtils} from '../../utils/index';
import {MAIN} from '../../constants';
import {CoverageIcon} from '../Coverages/';

export const PlanningDateTime = ({
    item,
    date,
    users,
    desks,
    activeFilter,
    contentTypes,
    includeScheduledUpdates,
    contacts,
}) => {
    const coverages = get(item, 'coverages', []);
    const coverageTypes = planningUtils.mapCoverageByDate(coverages);
    const hasAssociatedEvent = !!get(item, 'event_item');
    const isSameDay = (scheduled) => scheduled && (date == null || moment(scheduled).format('YYYY-MM-DD') === date);
    const coverageToDisplay = coverageTypes.filter((coverage) => {
        const scheduled = get(coverage, 'planning.scheduled');

        if (includeScheduledUpdates && get(coverage, 'scheduled_updates.length') > 0) {
            for (let i = 0; i < coverage.scheduled_updates.length; i++) {
                if (isSameDay(coverage.scheduled_updates[i].planning.scheduled)) {
                    return true;
                }
            }
        }

        if (activeFilter === MAIN.FILTERS.COMBINED) {
            // Display if it has an associated event or if adhoc planning has coverage on that date
            if (hasAssociatedEvent || isSameDay(scheduled)) {
                return true;
            }
        } else if (scheduled && isSameDay(scheduled)) {
            // Planning-only view - display only coverage of the particular date
            return true;
        }

        return false;
    });

    return (
        <span
            data-test-id="coverage-icons"
            className="sd-no-wrap"
        >
            {coverageToDisplay.map((coverage, i) => (
                <CoverageIcon
                    key={i}
                    users={users}
                    desks={desks}
                    coverage={coverage}
                    contentTypes={contentTypes}
                    contacts={contacts}
                />
            )
            )}
        </span>
    );
};

PlanningDateTime.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    activeFilter: PropTypes.string,
    contentTypes: PropTypes.array,
    includeScheduledUpdates: PropTypes.bool,
    contacts: PropTypes.object,
};

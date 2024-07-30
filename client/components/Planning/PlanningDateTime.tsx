import React from 'react';
import {get} from 'lodash';
import moment from 'moment';

import {planningUtils} from '../../utils/index';
import {getRelatedEventIdsForPlanning} from '../../utils/planning';
import {MAIN} from '../../constants';
import {CoverageIcons} from '../Coverages/CoverageIcons';
import {IDesk, IUser} from 'superdesk-api';
import {IPlanningItem} from 'interfaces';

interface IProps {
    item: IPlanningItem;
    date?: string;
    users?: Array<IUser>;
    desks?: Array<IDesk>;
    activeFilter?: string;
    contentTypes?: Array<any>;
    includeScheduledUpdates?: boolean;
    contacts?: any;
    filterLanguage?: string;
}

export const PlanningDateTime = ({
    item,
    date,
    users,
    desks,
    activeFilter,
    contentTypes,
    includeScheduledUpdates,
    contacts,
    filterLanguage,
}: IProps) => {
    const coverages = get(item, 'coverages', []);
    const coverageTypes = planningUtils.mapCoverageByDate(coverages);
    const hasAssociatedEvent = getRelatedEventIdsForPlanning(item, 'primary').length > 0;
    const isSameDay = (scheduled) => scheduled && (date == null || moment(scheduled).format('YYYY-MM-DD') === date);
    const coverageToDisplay = coverageTypes.filter((coverage) => {
        const scheduled = get(coverage, 'planning.scheduled');

        // Display only the coverages that match the active filter language
        if (filterLanguage !== '' && filterLanguage != null && coverage.planning.language != filterLanguage) {
            return false;
        }

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
        <CoverageIcons
            coverages={coverageToDisplay}
            users={users}
            desks={desks}
            contentTypes={contentTypes}
        />
    );
};

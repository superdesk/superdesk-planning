import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment';

import {getCoverageIcon, planningUtils} from '../../utils/index';

export const PlanningDateTime = ({item, date, timeFormat}) => {
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
            {coveragesToDisplay.map((coverage, i) => (
                <span key={i} className="sd-list-item__slugline">
                    <i
                        className={classNames(
                            getCoverageIcon(coverage.g2_content_type),
                            coverage.iconColor
                        )}
                    />
                    : {moment(coverage.planning.scheduled).format(timeFormat)}
                </span>
            ))}

            {coveragesWithoutTimes.map((coverage, i) => (
                <i
                    key={i}
                    className={classNames(
                        getCoverageIcon(coverage.g2_content_type),
                        coverage.iconColor,
                        'sd-list-item__inline-icon'
                    )}
                />
            ))}
        </span>
    );
};

PlanningDateTime.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
};

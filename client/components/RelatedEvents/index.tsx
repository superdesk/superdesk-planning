import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {appConfig} from 'appConfig';

import {WORKFLOW_STATE} from '../../constants/index';

export const RelatedEvents = ({events, originalEvent}) => (
    <ul className="related-events">
        {(originalEvent ? [...events, originalEvent] : events).map(({
            _id, // eslint-disable-line camelcase
            slugline,
            name,
            dates,
            state,
        }) => {
            let startStr = moment(dates.start).format(appConfig.planning.dateformat);

            return (
                <li key={_id}>
                    <i className="icon-list-alt" />&nbsp;
                    {state && state === WORKFLOW_STATE.SPIKED &&
                    <span className="label label--alert">spiked</span>
                    }

                    <a>{slugline || name} {startStr}</a>
                </li>
            );
        })}
    </ul>
);

RelatedEvents.propTypes = {
    events: PropTypes.array.isRequired,
    originalEvent: PropTypes.object,
};

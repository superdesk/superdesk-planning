import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';

export const calendars = ({item, calendars}) => {
    const isCalendarActive = (cal) => (get((calendars || []).find((c) => c.qcode === cal.qcode), 'is_active', false));

    return (<div>
        <span className="sd-list-item__text-label">{gettext('Calendar:')}</span>
        {<span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-rm-10">
            {get(item, 'calendars.length', 0) > 0 && item.calendars.map((c, index, arr) =>
                <span key={c.qcode}
                    className={!isCalendarActive(c) ? 'sd-list-item__text--disabled' : ''}>
                    {c.name}{arr.length - 1 > index && ', '}
                </span>)
            }
            {get(item, 'calendars.length', 0) === 0 && <span>{gettext('No  calendar assigned')}</span>}
        </span>}
    </div>);
};

calendars.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    calendars: PropTypes.array,
};

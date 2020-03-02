/* eslint-disable react/no-multi-comp */

import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

export const calendars = ({item, calendars, grow}) => {
    const isCalendarActive = (cal) => (get((calendars || []).find((c) => c.qcode === cal.qcode), 'is_active', false));
    let tooltipElem = get(item, 'calendars', []).map((c) =>
        <div key={c.qcode}>{c.name}{!isCalendarActive(c) ? ' (Disabled)' : ''}</div>);

    return (<Fragment>
        <span className="sd-list-item__text-label">{gettext('Calendar:')}</span>
        {<span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-rm-10">
            {get(item, 'calendars.length', 0) > 0 && (<OverlayTrigger
                placement="left" overlay={<Tooltip id="location_tooltip" className="tooltip--text-left">
                    {tooltipElem}
                </Tooltip>}>
                <span>
                    {item.calendars.map((c, index, arr) => (
                        <span
                            key={c.qcode}
                            className={!isCalendarActive(c) ? 'sd-list-item__text--disabled' : ''}>
                            {c.name}{index === arr.length - 1 ? '' : ', '}
                        </span>
                    ))}</span>
            </OverlayTrigger>)}
            {get(item, 'calendars.length', 0) === 0 && <span>{gettext('No  calendar assigned')}</span>}
        </span>}
    </Fragment>);
};

calendars.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
        calendars: PropTypes.array,
    }).isRequired,
    calendars: PropTypes.array,
    grow: PropTypes.bool,
};

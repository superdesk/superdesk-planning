/* eslint-disable react/no-multi-comp */

import React, {Fragment} from 'react';
import {get} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {ICalendar} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

interface IProps {
    item: any;
    calendars: Array<ICalendar>;
    field?: string;
}

export class calendars extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'calendars';
        const calendars = get(this.props.item, field) || [];
        const isCalendarActive = (cal) => get(
            (this.props.calendars ?? []).find((c) => c.qcode === cal.qcode),
            'is_active',
            false
        );
        const tooltipElem = calendars.map((c) => (
            <div key={c.qcode}>
                {c.name}{!isCalendarActive(c) ? ' (Disabled)' : ''}
            </div>
        ));

        return (
            <Fragment>
                <span className="sd-list-item__text-label">{gettext('Calendar:')}</span>
                {<span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-rm-10">
                    {calendars.length > 0 ? (
                        <OverlayTrigger
                            placement="left"
                            overlay={(
                                <Tooltip id="location_tooltip" className="tooltip--text-left">
                                    {tooltipElem}
                                </Tooltip>
                            )}
                        >
                            <span>
                                {calendars.map((c, index, arr) => (
                                    <span
                                        key={c.qcode}
                                        className={!isCalendarActive(c) ? 'sd-list-item__text--disabled' : ''}
                                    >
                                        {c.name}{index === arr.length - 1 ? '' : ', '}
                                    </span>
                                ))}
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <span>
                            {gettext('No  calendar assigned')}
                        </span>
                    )}
                </span>}
            </Fragment>
        );
    }
}

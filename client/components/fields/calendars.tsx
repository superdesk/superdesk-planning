/* eslint-disable react/no-multi-comp */

import React, {Fragment} from 'react';
import {get} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {ICalendar} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

interface IProps {
    item: any;
    calendars: Array<ICalendar>;
    field?: string;
    language?: string;
}

export class calendars extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'calendars';
        const qcodes: Array<ICalendar['qcode']> = (get(this.props.item, field) || [])
            .map((calendar) => calendar.qcode);
        const calendars: Array<{
            qcode: string,
            name: string,
            tooltip: string,
            disabled: boolean,
        }> = [];

        this.props.calendars
            .filter((calendar) => qcodes.includes(calendar.qcode))
            .forEach((calendar) => {
                const name = getVocabularyItemFieldTranslated(
                    calendar,
                    'name',
                    this.props.language
                );

                calendars.push({
                    qcode: calendar.qcode,
                    name: name,
                    tooltip: calendar.is_active ?
                        name :
                        gettext('{{ name }} (disabled)', {name: name}),
                    disabled: !calendar.is_active,
                });
            });

        return (
            <Fragment>
                <span className="sd-list-item__text-label">{gettext('Calendar:')}</span>
                {<span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-rm-10">
                    {calendars.length > 0 ? (
                        <OverlayTrigger
                            placement="left"
                            overlay={(
                                <Tooltip
                                    id="location_tooltip"
                                    className="tooltip--text-left"
                                >
                                    {calendars.map((calendar) => (
                                        <div key={calendar.qcode}>
                                            {calendar.tooltip}
                                        </div>
                                    ))}
                                </Tooltip>
                            )}
                        >
                            <span>
                                {calendars.map((calendar, index, array) => (
                                    <span
                                        key={calendar.qcode}
                                        className={calendar.disabled ? 'sd-list-item__text--disabled' : ''}
                                    >
                                        {calendar.name}{index === array.length - 1 ? '' : ', '}
                                    </span>
                                ))}
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <span>
                            {gettext('No calendars assigned')}
                        </span>
                    )}
                </span>}
            </Fragment>
        );
    }
}

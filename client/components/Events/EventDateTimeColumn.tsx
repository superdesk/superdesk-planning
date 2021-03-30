import * as React from 'react';
import moment from 'moment-timezone';

import {IEventItem} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

import {eventUtils, timeUtils} from '../../utils';

import {Column, Row} from '../UI/List';
import {DateTime} from '../UI';
import {EventDateTime} from './EventDateTime';

interface IProps {
    item: IEventItem;
    multiRow?: boolean;
}

export class EventDateTimeColumn extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        if (!this.props.multiRow) {
            return (
                <Column border={false} className="flex-justify--start sd-padding-t--1">
                    <Row classes="sd-margin--0">
                        <EventDateTime item={this.props.item} />
                    </Row>
                </Column>
            );
        }

        const start = moment.tz(moment(this.props.item.dates.start), this.props.item.dates.tz);
        const end = moment.tz(moment(this.props.item.dates.end), this.props.item.dates.tz);
        const isAllDay = eventUtils.isEventAllDay(start, end);
        const multiDay = !start.isSame(end, 'day');
        const isThisYear = start.isSame(moment(), 'year');
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(this.props.item);
        const tzCode = timeUtils.getTimeZoneAbbreviation(start.format('z'));
        const commonProps = {
            padLeft: false,
            toBeConfirmed: this.props.item._time_to_be_confirmed,
        };

        return (
            <React.Fragment>
                <Column border={false}>
                    <Row classes="flex-justify--end">
                        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                            <DateTime
                                withDate={true}
                                withYear={!isThisYear}
                                withTime={false}
                                date={start}
                                {...commonProps}
                            />
                            {!multiDay ? null : (
                                <React.Fragment>
                                    &ndash;
                                    <DateTime
                                        withDate={true}
                                        withYear={!isThisYear}
                                        withTime={false}
                                        date={end}
                                        {...commonProps}
                                    />
                                </React.Fragment>
                            )}
                            {!isRemoteTimeZone ? null : (
                                <span className="sd-margin-l--0-5">(
                                    <span className="EventDateTime__timezone">
                                        {tzCode}
                                    </span>
                                )</span>
                            )}
                        </span>
                    </Row>
                    <Row classes="flex-justify--end">
                        <span className="EventDateTime sd-list-item__slugline sd-no-wrap">
                            {isAllDay ? (
                                gettext('All day')
                            ) : (
                                <React.Fragment>
                                    <DateTime
                                        withDate={false}
                                        withYear={false}
                                        date={start}
                                        {...commonProps}
                                    />
                                    &ndash;
                                    <DateTime
                                        withDate={false}
                                        withYear={false}
                                        date={end}
                                        {...commonProps}
                                    />
                                </React.Fragment>
                            )}
                        </span>
                    </Row>
                </Column>
            </React.Fragment>
        );
    }
}

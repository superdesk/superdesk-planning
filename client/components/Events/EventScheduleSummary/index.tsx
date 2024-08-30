import React from 'react';
import {get} from 'lodash';

import {IEventItem} from 'interfaces';
import {gettext, eventUtils, timeUtils} from '../../../utils';

import {FormLabel, Text, ContentDivider} from 'superdesk-ui-framework/react';
import {RepeatEventSummary} from '../RepeatEventSummary';
import {Row} from '../../UI/Preview';

import './style.scss';


interface IProps {
    event: Partial<IEventItem>,
    noPadding?: boolean,
    forUpdating?: boolean,
    useEventTimezone?: boolean
    useFormLabelAndText?: boolean
    addContentDivider?: boolean
}

export const EventScheduleSummary = ({
    event,
    noPadding = false,
    forUpdating = false,
    useEventTimezone = false,
    useFormLabelAndText = false,
    addContentDivider = false,
}: IProps) => {
    if (!event) {
        return null;
    }

    const eventSchedule: IEventItem['dates'] = get(event, 'dates', {});
    const doesRepeat = get(eventSchedule, 'recurring_rule', null) !== null;
    const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(event);
    const eventDateText = eventUtils.getDateStringForEvent(
        event,
        false,
        true,
        isRemoteTimeZone
    );
    let newDateString, currentDateText, remoteDateText, currentDateLabel, datesToShow, datesToShowRemote;

    datesToShow = eventUtils.getDateStringForEvent(event, false,
        true,
        isRemoteTimeZone);

    if (isRemoteTimeZone) {
        const remoteEvent = {
            ...event,
            dates: {
                ...eventSchedule,
                start: timeUtils.getDateInRemoteTimeZone(
                    eventSchedule.start,
                    eventSchedule.tz
                ),
                end: timeUtils.getDateInRemoteTimeZone(
                    eventSchedule.end,
                    eventSchedule.tz
                ),
            },
        };


        newDateString = eventUtils.getDateStringForEvent(
            remoteEvent,
            false,
            false
        );

        datesToShowRemote = eventUtils.getDateStringForEvent(remoteEvent, false, false);
    }

    currentDateText = datesToShow;
    remoteDateText = datesToShowRemote;
    currentDateLabel = gettext('Current Date');
    if (useEventTimezone && isRemoteTimeZone) {
        currentDateText = newDateString.replace(/[\(\)]/g, '');
        remoteDateText = `(${eventDateText})`;
        currentDateLabel = gettext('Current Date (Based on Event timezone)');
    }

    return useFormLabelAndText ? (
        <React.Fragment>
            <div>
                <FormLabel text={forUpdating ? currentDateLabel : gettext('Date:')} />
                <Text size="small" weight="medium">
                    {currentDateText || ''}
                </Text>
            </div>
            {addContentDivider !== true ? null : (
                <ContentDivider type="dashed" margin="x-small" />
            )}
            {doesRepeat !== true ? null : (
                <React.Fragment>
                    <div>
                        <FormLabel text={gettext('Repeat Summary')} />
                        <Text size="small" weight="medium">
                            {eventUtils.getRepeatSummaryForEvent(eventSchedule)}
                        </Text>
                    </div>
                    {addContentDivider !== true ? null : (
                        <ContentDivider type="dashed" margin="x-small" />
                    )}
                </React.Fragment>
            )}
        </React.Fragment>
    ) : (
        <React.Fragment>
            <Row
                label={forUpdating ? currentDateLabel : gettext('Date:')}
                value={currentDateText || ''}
                noPadding={noPadding || isRemoteTimeZone}
                dataTestId="field-dates"
            />
            {isRemoteTimeZone && (
                <Row
                    value={remoteDateText || ''}
                    noPadding={noPadding}
                    dataTestId="field-dates_timezone"
                />
            )}

            {doesRepeat && (
                <Row noPadding={noPadding} dataTestId="field-dates_repeat">
                    <RepeatEventSummary
                        schedule={eventSchedule}
                        noMargin={noPadding}
                        forUpdating={forUpdating}
                    />
                </Row>
            )}
        </React.Fragment>
    );
};

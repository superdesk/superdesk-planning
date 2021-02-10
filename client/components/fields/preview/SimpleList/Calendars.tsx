import * as React from 'react';

import {superdeskApi} from '../../../../superdeskApi';
import {PreviewSimpleListItem} from './PreviewSimpleListItem';
import {ICalendarPreviewProps, calendarPreviewHoc} from '../CalendarPreviewHoc';

class PreviewFieldCalendarsComponent extends React.PureComponent<ICalendarPreviewProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <PreviewSimpleListItem
                label={gettext('Calendars:')}
                data={this.props.calendarNames}
            />
        );
    }
}

export const PreviewFieldCalendars = calendarPreviewHoc(PreviewFieldCalendarsComponent);

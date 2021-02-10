import * as React from 'react';

import {superdeskApi} from '../../../../superdeskApi';
import {FormPreviewItem} from './FormPreviewItem';
import {ICalendarPreviewProps, calendarPreviewHoc} from '../CalendarPreviewHoc';

class FormPreviewCalendarsComponent extends React.PureComponent<ICalendarPreviewProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <FormPreviewItem
                label={gettext('Calendars')}
                value={this.props.calendarNames}
                light={true}
            />
        );
    }
}

export const FormPreviewCalendars = calendarPreviewHoc(FormPreviewCalendarsComponent);

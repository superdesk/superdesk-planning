import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldCalendars extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'calendars';
        const calendarNames = (get(this.props.item, field) || [])
            .map((calendar) => calendar.name)
            .join(', ');

        if (!calendarNames.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Calendars:')}
                data={calendarNames}
            />
        );
    }
}

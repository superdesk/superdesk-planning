import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldNoCalendarAssigned extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'no_calendar_assigned';
        const noCalendarAssigned = (get(this.props.item, field));

        if (noCalendarAssigned == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('No Calendar Assigned:')}
                data={noCalendarAssigned == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

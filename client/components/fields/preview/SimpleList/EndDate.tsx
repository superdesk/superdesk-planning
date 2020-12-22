import * as React from 'react';
import {get} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldEndDate extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'end_date';
        const endDate = get(this.props.item, field);

        if (endDate == null) {
            return null;
        }

        const endDateString = moment(endDate).format(
            appConfig.planning.dateformat +
            ' ' +
            appConfig.planning.timeformat
        );

        return (
            <PreviewSimpleListItem
                label={gettext('To:')}
                data={endDateString}
            />
        );
    }
}

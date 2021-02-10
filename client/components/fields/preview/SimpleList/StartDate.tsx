import * as React from 'react';
import {get} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldStartDate extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'start_date';
        const startDate = get(this.props.item, field);

        if (startDate == null) {
            return null;
        }

        const startDateString = moment(startDate).format(
            appConfig.planning.dateformat +
            ' ' +
            appConfig.planning.timeformat
        );

        return (
            <PreviewSimpleListItem
                label={gettext('From:')}
                data={startDateString}
            />
        );
    }
}

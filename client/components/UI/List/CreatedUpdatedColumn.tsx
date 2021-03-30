import * as React from 'react';
import moment from 'moment-timezone';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../superdeskApi';
import {IEventOrPlanningItem} from '../../../interfaces';

import {timeUtils} from '../../../utils';

import {Column} from './Column';
import {Row} from './Row';

interface IProps {
    item: IEventOrPlanningItem;
    field: 'firstcreated' | 'versioncreated';
    minTimeWidth?: string;
}

export class CreatedUpdatedColumn extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const datetime = this.props.item[this.props.field];
        const datetimeLongFormat = moment.tz(
            datetime,
            timeUtils.localTimeZone()
        ).format(appConfig.longDateFormat || 'LLL');
        const tooltip = this.props.field === 'firstcreated' ?
            gettext('Created : {{ datetime }}', {datetime: datetimeLongFormat}) :
            gettext('Modified: {{ datetime }}', {datetime: datetimeLongFormat});

        return (
            <Column className="flex-justify--start sd-padding-t--1">
                <Row classes="sd-margin-t--0 sd-margin-r--0-5">
                    <time
                        title={tooltip}
                        style={{
                            minWidth: this.props.minTimeWidth ?? 0,
                            paddingLeft: 0,
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        {timeUtils.getDateForVersionInList(datetime)}
                    </time>
                </Row>
            </Column>
        );
    }
}

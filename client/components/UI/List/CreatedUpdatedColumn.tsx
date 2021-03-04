import * as React from 'react';
import moment from 'moment-timezone';

import {appConfig} from 'appConfig';
import {IEventOrPlanningItem} from '../../../interfaces';

import {timeUtils} from '../../../utils';

import {Column} from './Column';
import {Row} from './Row';

interface IProps {
    item: IEventOrPlanningItem;
    field: '_created' | '_updated';
}

export class CreatedUpdatedColumn extends React.PureComponent<IProps> {
    render() {
        const tooltip = moment.tz(
            this.props.item._created,
            timeUtils.localTimeZone()
        ).format(appConfig.longDateFormat || 'LLL');

        return (
            <Column className="flex-justify--start sd-padding-t--1">
                <Row classes="sd-margin-t--0 sd-margin-r--0-5">
                    <time title={tooltip}>
                        {timeUtils.getDateForVersionInList(this.props.item[this.props.field])}
                    </time>
                </Row>
            </Column>
        );
    }
}

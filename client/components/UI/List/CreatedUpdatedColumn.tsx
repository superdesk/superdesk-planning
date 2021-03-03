import * as React from 'react';

import {IEventOrPlanningItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {timeUtils} from '../../../utils';

import {Column} from './Column';
import {Row} from './Row';

interface IProps {
    item: IEventOrPlanningItem;
}

export class CreatedUpdatedColumn extends React.PureComponent<IProps> {
    render() {
        const {longFormatDateTime} = superdeskApi.localization;

        return (
            <Column>
                <Row>
                    <time title={longFormatDateTime(this.props.item._created)}>
                        {timeUtils.getDateForVersionInList(this.props.item._updated)}
                    </time>
                </Row>
            </Column>
        );
    }
}

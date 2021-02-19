import * as React from 'react';

import {IEventItem, IListFieldProps} from '../../../interfaces';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

import {EventScheduleSummary} from '../../Events/EventScheduleSummary';

export class PreviewFieldEventSchedule extends React.PureComponent<IListFieldProps> {
    render() {
        const item = this.props.item as IEventItem;

        return (
            <EventScheduleSummary
                schedule={{
                    dates: item.dates,
                    [TO_BE_CONFIRMED_FIELD]: item._time_to_be_confirmed,
                }}
            />
        );
    }
}

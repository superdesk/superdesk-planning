import * as React from 'react';

import {IEventItem, IListFieldProps} from '../../../interfaces';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

import {EventScheduleSummary} from '../../Events/EventScheduleSummary';

interface IProps extends IListFieldProps {
    useFormLabelAndText?: boolean
    addContentDivider?: boolean
}

export class PreviewFieldEventSchedule extends React.PureComponent<IProps> {
    render() {
        const item = this.props.item as IEventItem;

        return (
            <EventScheduleSummary
                event={{
                    dates: item.dates,
                    [TO_BE_CONFIRMED_FIELD]: item._time_to_be_confirmed,
                }}
                useFormLabelAndText={this.props.useFormLabelAndText}
                addContentDivider={this.props.addContentDivider}
            />
        );
    }
}

import * as React from 'react';
import {get} from 'lodash';

import {appConfig} from 'appConfig';
import {IListFieldProps} from '../../../interfaces';

import {getDateTimeString} from '../../../utils';

import {Icon} from 'superdesk-ui-framework/react';

export class ListFieldDateTime extends React.PureComponent<IListFieldProps> {
    getValueString() {
        const field = this.props.field ?? 'datetime';
        const value = get(this.props.item, field);

        return getDateTimeString(
            value,
            appConfig.view.dateformat,
            appConfig.view.timeformat,
        );
    }

    render() {
        return (
            <span>
                <Icon name="time" />
                {this.getValueString()}
            </span>
        );
    }
}

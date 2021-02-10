import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';

export class ListFieldName extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'name';
        const name = get(this.props.item, field) || '';

        if (name.length > 0) {
            return (
                <span className="sd-overflow-ellipsis">
                    {name}
                </span>
            );
        }

        return null;
    }
}

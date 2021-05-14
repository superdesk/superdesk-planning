import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';

export class ListFieldDescription extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'description_text';
        const description = get(this.props.item, field) || '';

        if (description.length > 0) {
            return (
                <span className="sd-overflow-ellipsis">
                    {description}
                </span>
            );
        }

        return null;
    }
}

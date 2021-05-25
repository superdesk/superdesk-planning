import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';

export class ListFieldSlugline extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'slugline';
        const slugline = get(this.props.item, field) || '';

        if (slugline.length > 0) {
            return (
                <span className="sd-overflow-ellipsis">
                    <span className="sd-list-item__slugline">{slugline}</span>
                </span>
            );
        }

        return null;
    }
}

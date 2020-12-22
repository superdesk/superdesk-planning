import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps} from '../../../interfaces';
import {getItemTypeOptionName} from '../../../utils/eventsplanning';

export class ListFieldItemType extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'item_type';
        const itemType = get(this.props.item, field) || '';

        if (itemType.length > 0) {
            return (
                <span className="sd-list-item--element-grow">
                    <span className="sd-list-item__text-label">
                        {gettext('Type:')}
                    </span>
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                        {getItemTypeOptionName(itemType)}
                    </span>
                </span>
            );
        }

        return null;
    }
}

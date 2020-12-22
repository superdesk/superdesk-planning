import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps, FILTER_TYPE} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

import {getItemTypeOptionName} from '../../../../utils/eventsplanning';

export class PreviewFieldItemType extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'item_type';
        const itemType = get(this.props.item, field) || FILTER_TYPE.COMBINED;

        return (
            <PreviewSimpleListItem
                label={gettext('Item Type:')}
                data={getItemTypeOptionName(itemType)}
            />
        );
    }
}

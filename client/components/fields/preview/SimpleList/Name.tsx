import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldName extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'name';
        const name = get(this.props.item, field);

        if (!name?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Name:')}
                data={name}
            />
        );
    }
}

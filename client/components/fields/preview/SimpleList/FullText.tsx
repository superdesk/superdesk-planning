import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldFullText extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'full_text';
        const name = get(this.props.item, field);

        if (!name?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Search Text:')}
                data={name}
            />
        );
    }
}

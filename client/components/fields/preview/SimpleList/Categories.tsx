import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldCategories extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'anpa_category';
        const categoryNames = (get(this.props.item, field) || [])
            .map((category) => category.name)
            .join(', ');

        if (!categoryNames.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('ANPA Category:')}
                data={categoryNames}
            />
        );
    }
}

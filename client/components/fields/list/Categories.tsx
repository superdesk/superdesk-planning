import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps} from '../../../interfaces';

export class ListFieldCategories extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'anpa_category';
        const categoryNames = (get(this.props.item, field) || [])
            .map((category) => category.name)
            .join(', ');

        if (categoryNames.length > 0) {
            return (
                <div className="sd-list-item--element-grow">
                    <span className="sd-list-item__text-label">
                        {gettext('ANPA Category:')}
                    </span>
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                        {categoryNames}
                    </span>
                </div>
            );
        }

        return null;
    }
}

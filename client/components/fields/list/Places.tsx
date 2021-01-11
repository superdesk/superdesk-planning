import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps} from '../../../interfaces';

export class ListFieldPlaces extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'place';
        const placeNames = (get(this.props.item, field) || [])
            .map((place) => place.name)
            .join(', ');

        if (placeNames.length > 0) {
            const {gettext} = superdeskApi.localization;

            return (
                <div className="sd-list-item--element-grow">
                    <span className="sd-list-item__text-label">
                        {gettext('Places:')}
                    </span>
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                        {placeNames}
                    </span>
                </div>
            );
        }

        return null;
    }
}

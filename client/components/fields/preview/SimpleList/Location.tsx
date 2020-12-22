import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldLocation extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'location';
        const location = get(this.props.item, field);

        if (!location?.name?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Location')}
                data={location.name}
            />
        );
    }
}

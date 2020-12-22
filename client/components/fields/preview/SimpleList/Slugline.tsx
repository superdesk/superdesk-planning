import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldSlugline extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'slugline';
        const slugline = get(this.props.item, field);

        if (!slugline?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Slugline:')}
                data={slugline}
            />
        );
    }
}

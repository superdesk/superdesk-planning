import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldFeatured extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'featured';
        const featured = (get(this.props.item, field));

        if (featured == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Featured:')}
                data={featured == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

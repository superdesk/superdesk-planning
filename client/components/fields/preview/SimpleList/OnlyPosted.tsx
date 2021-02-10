import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldOnlyPosted extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'posted';
        const posted = (get(this.props.item, field));

        if (posted == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Posted:')}
                data={posted == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

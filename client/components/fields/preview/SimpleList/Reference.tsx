import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldReference extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'reference';
        const reference = get(this.props.item, field);

        if (!reference?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Reference:')}
                data={reference}
            />
        );
    }
}

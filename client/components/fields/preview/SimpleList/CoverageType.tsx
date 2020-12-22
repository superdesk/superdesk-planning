import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldCoverageType extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'g2_content_type';
        const coverageType = get(this.props.item, field);

        if (!coverageType?.name?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Coverage Type')}
                data={coverageType.name}
            />
        );
    }
}

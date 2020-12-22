import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldLanguage extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'language';
        const coverageType = get(this.props.item, field);

        if (!coverageType?.name?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Language')}
                data={coverageType.name}
            />
        );
    }
}

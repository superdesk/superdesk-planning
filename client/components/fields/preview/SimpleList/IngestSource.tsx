import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldIngestSource extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'source';
        const sourceNames = (get(this.props.item, field) || [])
            .map((source) => source.name)
            .join(', ');

        if (!sourceNames.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Ingest Sources')}
                data={sourceNames}
            />
        );
    }
}

import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldNoCoverage extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'no_coverage';
        const noCoverage = (get(this.props.item, field));

        if (noCoverage == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Featured:')}
                data={noCoverage == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

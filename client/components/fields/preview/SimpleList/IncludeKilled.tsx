import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldIncludeKilled extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'include_killed';
        const posted = (get(this.props.item, field));

        if (posted == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Include Killed:')}
                data={posted == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

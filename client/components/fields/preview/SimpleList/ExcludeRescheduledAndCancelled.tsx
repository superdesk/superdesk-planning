import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldExcludeRescheduledAndCancelled extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'exclude_rescheduled_and_cancelled';
        const exclude = (get(this.props.item, field));

        if (exclude == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Exclude Rescheduled And Cancelled')}
                data={exclude == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

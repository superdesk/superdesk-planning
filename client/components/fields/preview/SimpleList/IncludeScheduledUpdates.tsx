import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldIncludeScheduledUpdates extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'include_scheduled_updates';
        const adHocPlanning = (get(this.props.item, field));

        if (adHocPlanning == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Include Scheduled Updates')}
                data={adHocPlanning == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

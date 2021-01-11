import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldAdHocPlanning extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'ad_hoc_planning';
        const adHocPlanning = (get(this.props.item, field));

        if (adHocPlanning == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Ad Hoc Planning')}
                data={adHocPlanning == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}

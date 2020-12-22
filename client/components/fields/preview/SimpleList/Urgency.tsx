import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldUrgency extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'urgency';
        const urgency = get(this.props.item, field);

        if (!urgency?.name?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Urgency:')}
                data={urgency.name}
            />
        );
    }
}

import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldWorkflowState extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'state';
        const stateNames = (get(this.props.item, field) || [])
            .map((place) => place.name)
            .join(', ');

        if (!stateNames.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Workflow State:')}
                data={stateNames}
            />
        );
    }
}

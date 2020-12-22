import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldLockState extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'lock_state';
        const lockState = get(this.props.item, field);

        if (!lockState.length) {
            return null;
        }

        const lockStateString = lockState === 'locked' ?
            gettext('Locked') :
            gettext('Not Locked');

        return (
            <PreviewSimpleListItem
                label={gettext('Lock State')}
                data={lockStateString}
            />
        );
    }
}

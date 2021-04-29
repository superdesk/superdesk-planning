import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';

export class EditorFieldLockState extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.props.field ?? 'lock_state'}
                label={this.props.label ?? gettext('Lock State')}
                options={[{
                    qcode: 'locked',
                    label: gettext('Locked'),
                }, {
                    qcode: 'unlocked',
                    label: gettext('Not Locked'),
                }]}
                clearable={true}
                valueAsString={true}
            />
        );
    }
}

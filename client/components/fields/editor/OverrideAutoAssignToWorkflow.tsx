import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldOverrideAutoAssignToWorkflow extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                {...this.props}
                field={this.props.field ?? 'flags.overide_auto_assign_to_workflow'}
                label={this.props.label ?? gettext('Forward Planning')}
                defaultValue={false}
            />
        );
    }
}

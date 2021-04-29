import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldIncludeKilled extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                {...this.props}
                field={this.props.field ?? 'include_killed'}
                label={this.props.label ?? gettext('Include Killed')}
                defaultValue={false}
            />
        );
    }
}

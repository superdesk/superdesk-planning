import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldOnlyPosted extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                field={this.props.field ?? 'posted'}
                label={this.props.label ?? gettext('Only Posted')}
                defaultValue={false}
                {...this.props}
            />
        );
    }
}

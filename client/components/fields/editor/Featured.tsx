import * as React from 'react';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';

export class EditorFieldFeatured extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                {...this.props}
                field={this.props.field ?? 'featured'}
                label={this.props.label ?? gettext('Featured')}
            />
        );
    }
}

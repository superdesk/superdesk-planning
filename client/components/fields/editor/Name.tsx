import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldText} from './base/text';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldName extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldText
                field={this.props.field ?? 'name'}
                label={this.props.label ?? gettext('Name')}
                {...this.props}
            />
        );
    }
}

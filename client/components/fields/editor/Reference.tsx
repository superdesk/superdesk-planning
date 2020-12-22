import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldText} from './base/text';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldReference extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldText
                field={this.props.field ?? 'reference'}
                label={this.props.label ?? gettext('Reference')}
                {...this.props}
            />
        );
    }
}

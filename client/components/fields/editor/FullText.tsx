import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldText} from './base/text';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldFullText extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldText
                {...this.props}
                field={this.props.field ?? 'full_text'}
                label={this.props.label ?? gettext('Search Text')}
            />
        );
    }
}

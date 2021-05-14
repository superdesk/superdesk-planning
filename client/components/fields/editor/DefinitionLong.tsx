import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldTextArea} from './base/textArea';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldDefinitionLong extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            field,
            label,
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldTextArea
                ref={refNode}
                {...props}
                field={field ?? 'definition_long'}
                label={label ?? gettext('Long Description')}
            />
        );
    }
}

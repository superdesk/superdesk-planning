import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldTextArea} from './base/textArea';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldDescriptionText extends React.PureComponent<IEditorFieldProps> {
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
                field={field ?? 'description_text'}
                label={label ?? gettext('Description')}
            />
        );
    }
}

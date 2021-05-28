import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldTextArea} from './base/textArea';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldEdnote extends React.PureComponent<IEditorFieldProps> {
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
                field={field ?? 'ednote'}
                label={label ?? gettext('Ed Note')}
            />
        );
    }
}

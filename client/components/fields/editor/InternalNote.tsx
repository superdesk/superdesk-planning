import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldExpandableTextArea} from './base/expandableTextArea';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldInternalNote extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            field,
            label,
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldExpandableTextArea
                ref={refNode}
                {...props}
                field={field ?? 'internal_note'}
                label={label ?? gettext('Internal Note')}
            />
        );
    }
}

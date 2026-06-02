import * as React from 'react';

import {IProfileSchemaTypeString, IEditorFieldProps} from '../../../../interfaces';

import {EditorFieldText} from './text';
import {EditorFieldTextArea} from './textArea';
import {EditorFieldExpandableTextArea} from './expandableTextArea';
import {EditorFieldTextEditor3} from './textEditor3';
import {CHANGE_DELAY} from '../../../../constants';

export function getTextFieldComponent(schema?: IProfileSchemaTypeString) {
    switch (schema?.field_type) {
    case 'single_line':
        return EditorFieldText;
    case 'multi_line':
        return schema.expandable ?
            EditorFieldExpandableTextArea :
            EditorFieldTextArea;
    case 'editor_3':
        return EditorFieldTextEditor3;
    }

    return EditorFieldText;
}

interface IProps extends IEditorFieldProps {
    schema?: IProfileSchemaTypeString;
    noPadding?: boolean;
    language?: string;
}

export class EditorFieldDynamicTextType extends React.PureComponent<IProps> {
    render() {
        const Component = getTextFieldComponent(this.props.schema);
        const {refNode, ...props} = this.props;

        props.debounce = CHANGE_DELAY;

        // TODO: Support min/max length, required etc from props.schema

        return (
            <Component
                ref={refNode}
                {...props}
            />
        );
    }
}

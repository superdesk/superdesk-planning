import * as React from 'react';

import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldText} from './base/text';

interface IProps extends IEditorFieldProps {
    schema: IProfileSchemaTypeString;
}

export class EditorFieldName extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldText
                ref={refNode}
                {...props}
                field={props.field ?? 'name'}
                label={props.label ?? gettext('Name')}
                maxLength={props.schema?.maxlength}
                required={props.required || props.schema?.required}
            />
        );
    }
}

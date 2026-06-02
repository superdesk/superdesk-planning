import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';

export interface IEditorFieldTextProps extends IEditorFieldProps {
    type?: 'text' | 'password' | 'number';
    maxLength?: number;
    info?: string;
    inlineLabel?: boolean;
    schema?: IProfileSchemaTypeString;
    noPadding: boolean;
    language?: string;
    debounce?: number;
}

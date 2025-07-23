import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';

export interface IEditorFieldTextAreaProps extends IEditorFieldProps {
    maxLength?: number;
    schema?: IProfileSchemaTypeString;
    multiLine?: boolean;
    autoHeight?: boolean;
    rows?: number;
    labelIcon?: string;
    noPadding?: boolean;
    debounce?: number;
}

import {IEditorFieldProps} from '../../../interfaces';

export interface ICustomTextFieldProps extends IEditorFieldProps {
    storageField: string;
    valueStoredAsArray?: boolean;
}

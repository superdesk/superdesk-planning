import {IFile} from '../interfaces';

export interface IPropsAttachmentsEditorStandalone {
    value: Array<IFile['_id']>;
    onChange(value: Array<IFile['_id']>): void;
    readOnly?: boolean;
    fileAccept?: string;
}

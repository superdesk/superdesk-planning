import {ICommonFieldConfig} from 'superdesk-api';
import {IFile} from '../../../../interfaces';

export type IAttachmentsValueOperational = Array<IFile['_id']>;
export type IAttachmentsValueStorage = IAttachmentsValueOperational;
export type IAttachmentsFieldUserPreferences = never;
export type IAttachmentsFieldConfig = ICommonFieldConfig;

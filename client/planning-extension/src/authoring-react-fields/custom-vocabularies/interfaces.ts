import {ICommonFieldConfig, IVocabulary} from 'superdesk-api';

export type ICustomVocabulariesValueOperational = Array<IVocabulary['_id']>;
export type ICustomVocabulariesValueStorage = ICustomVocabulariesValueOperational;
export type ICustomVocabulariesFieldUserPreferences = never;
export type ICustomVocabulariesFieldConfig = ICommonFieldConfig;

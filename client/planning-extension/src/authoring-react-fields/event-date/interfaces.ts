import {ICommonFieldConfig} from 'superdesk-api';
import {IEventItem} from '../../../../interfaces';

export type IEventDateValueOperational = IEventItem['dates'];
export type IEventDateValueStorage = IEventDateValueOperational;
export type IEventDateFieldUserPreferences = never;
export type IEventDateFieldConfig = {all_day?: boolean;} & ICommonFieldConfig;

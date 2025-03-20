import {ICommonFieldConfig} from 'superdesk-api';
import {IEventItem} from '../../../../interfaces';

export type IEventDateValueOperational = Pick<IEventItem, 'dates' | '_time_to_be_confirmed' | '_endTime' | '_startTime'>;
export type IEventDateValueStorage = IEventDateValueOperational;
export type IEventDateFieldUserPreferences = never;
export type IEventDateFieldConfig = ICommonFieldConfig;

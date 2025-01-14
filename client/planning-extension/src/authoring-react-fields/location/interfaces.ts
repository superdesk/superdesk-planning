import {ICommonFieldConfig} from 'superdesk-api';
import {ILocation} from '../../../../interfaces';

export type ILocationValueOperational = Array<ILocation>;
export type ILocationValueStorage = ILocationValueOperational;
export type ILocationFieldUserPreferences = never;
export type ILocationFieldConfig = ICommonFieldConfig;

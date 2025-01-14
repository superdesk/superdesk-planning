import {ICommonFieldConfig} from 'superdesk-api';
import {IPlanningCoverageItem} from '../../../../interfaces';

export type IContactValueOperational = Array<IPlanningCoverageItem>;
export type IContactValueStorage = IContactValueOperational;
export type IContactFieldUserPreferences = never;
export type IContactFieldConfig = {singleValue: boolean} & ICommonFieldConfig;

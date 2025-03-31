import {ICommonFieldConfig} from 'superdesk-api';
import {IEventItem} from '../../../../interfaces';

export type IRecurringRulesValueOperational = NonNullable<IEventItem['dates']>['recurring_rule'];
export type IRecurringRulesValueStorage = IRecurringRulesValueOperational;
export type IRecurringRulesFieldUserPreferences = never;
export type IRecurringRulesFieldConfig = ICommonFieldConfig;

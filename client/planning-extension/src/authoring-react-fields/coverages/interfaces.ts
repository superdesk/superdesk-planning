import {ICommonFieldConfig} from 'superdesk-api';
import {IPlanningCoverageItem} from '../../../../interfaces';

export type ICoveragesValueOperational = Array<IPlanningCoverageItem>;
export type ICoveragesValueStorage = ICoveragesValueOperational;
export type ICoveragesFieldUserPreferences = never;
export type ICoveragesFieldConfig = ICommonFieldConfig;

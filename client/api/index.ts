import {IPlanningAPI} from '../interfaces';
import {searchRaw as search} from './search';
import {events} from './events';
import {planning} from './planning';
import {coverages} from './coverages';
import {combined} from './combined';

export const planningApis: Omit<IPlanningAPI, 'redux'> = {
    events,
    planning,
    combined,
    coverages,
    search,
};

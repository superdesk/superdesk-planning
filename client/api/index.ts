import {IPlanningAPI} from '../interfaces';
import {searchRaw as search} from './search';
import {events} from './events';
import {planning} from './planning';
import {coverages} from './coverages';
import {combined} from './combined';
import {ui} from './ui';
import {locations} from './locations';
import {autosave} from './autosave';
import {editor} from './editor';

export const planningApis: Omit<IPlanningAPI, 'redux' | '$location'> = {
    events,
    planning,
    combined,
    coverages,
    search,
    ui,
    locations,
    autosave,
    editor,
};

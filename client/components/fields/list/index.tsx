import * as React from 'react';

import {ListFieldCategories} from './Categories';
import {ListFieldItemType} from './ItemType';
import {ListFieldName} from './Name';
import {ListFieldCalendars} from './Calendars';
import {ListFieldAgendas} from './Agendas';
import {ListFieldPlaces} from './Places';
import {ListFieldSubjects} from './Subject';

export const FIELD_TO_LIST_COMPONENT = {
    item_type: ListFieldItemType,
    name: ListFieldName,
    anpa_category: ListFieldCategories,
    calendars: ListFieldCalendars,
    agendas: ListFieldAgendas,
    place: ListFieldPlaces,
    subject: ListFieldSubjects,
};

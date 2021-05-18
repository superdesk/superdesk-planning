import * as React from 'react';

import {ListFieldCategories} from './Categories';
import {ListFieldItemType} from './ItemType';
import {ListFieldName} from './Name';
import {ListFieldCalendars} from './Calendars';
import {ListFieldAgendas} from './Agendas';
import {ListFieldPlaces} from './Places';
import {ListFieldSubjects} from './Subject';
import {PreviewFieldFilterSchedule} from '../common/PreviewFilterSchedule';
import {ListFieldSlugline} from './Slugline';
import {ListFieldDescription} from './Description';
import {ListFieldState} from './State';
import {ListFieldDateTime} from './DateTime';

export const FIELD_TO_LIST_COMPONENT = {
    item_type: ListFieldItemType,
    name: ListFieldName,
    anpa_category: ListFieldCategories,
    calendars: ListFieldCalendars,
    agendas: ListFieldAgendas,
    place: ListFieldPlaces,
    subject: ListFieldSubjects,
    filter_schedule: PreviewFieldFilterSchedule,
    slugline: ListFieldSlugline,
    description: ListFieldDescription,
    state: ListFieldState,
    datetime: ListFieldDateTime,
};

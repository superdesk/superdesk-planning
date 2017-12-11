import React from 'react';
import {gettext} from '../../utils';
import {EventHistory} from '../Events/EventHistory'

export const HistoryTab = ({item}) => (
    <div>
        { item._type === 'events' &&
            <EventHistory item={item} />
        }
    </div>
);

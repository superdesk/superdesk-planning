import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../utils';
import {EventHistory} from '../Events/';

export const HistoryTab = ({item}) => (
    <div>
        { getItemType(item) === 'events' &&
            <EventHistory item={item} />
        }
    </div>
);

HistoryTab.propTypes = {
    item: PropTypes.object.isRequired,
};

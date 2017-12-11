import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../utils';
import {EventHistory} from '../Events/';

export const HistoryTab = ({item}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case 'events':
        return (<EventHistory item={item} />);
    default:
        return null;
    }
};

HistoryTab.propTypes = {
    item: PropTypes.object.isRequired,
};

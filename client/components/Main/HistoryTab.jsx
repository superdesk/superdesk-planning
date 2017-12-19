import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../constants';
import {getItemType} from '../../utils';
import {EventHistory} from '../Events/';
import {PlanningHistory} from '../Planning/';

export const HistoryTab = ({item}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (<EventHistory item={item} />);
    case ITEM_TYPE.PLANNING:
        return (<PlanningHistory item={item} />);
    default:
        return null;
    }
};

HistoryTab.propTypes = {
    item: PropTypes.object.isRequired,
};

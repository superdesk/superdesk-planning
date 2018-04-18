import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../../utils';
import {ITEM_TYPE} from '../../../constants';
import {PlanningMenuPanel} from '../../Planning';

export const ItemMenuPanel = ({item, onMenuItemClick, activeItem}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case ITEM_TYPE.PLANNING:
        return (<PlanningMenuPanel
            item={item}
            onMenuItemClick={onMenuItemClick}
            activeItem={activeItem} />);
    default:
        return null;
    }
};

ItemMenuPanel.propTypes = {
    item: PropTypes.object.isRequired,
};

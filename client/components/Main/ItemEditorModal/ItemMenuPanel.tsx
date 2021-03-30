import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../../utils';
import {ITEM_TYPE} from '../../../constants';
import {PlanningMenuPanel} from '../../Planning';
import {EventMenuPanel} from '../../Events';

export const ItemMenuPanel = ({item, onMenuItemClick, activeItem}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (
            <EventMenuPanel
                item={item}
                onMenuItemClick={onMenuItemClick}
                activeItem={activeItem}
            />
        );
    case ITEM_TYPE.PLANNING:
        return (
            <PlanningMenuPanel
                item={item}
                onMenuItemClick={onMenuItemClick}
                activeItem={activeItem}
            />
        );
    default:
        return null;
    }
};

ItemMenuPanel.propTypes = {
    item: PropTypes.object.isRequired,
    onMenuItemClick: PropTypes.func,
    activeItem: PropTypes.string,
};

import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../../constants';
import {EventEditor} from '../../Events';
import {PlanningEditor} from '../../Planning';

export const EditorContentTab = ({itemType, ...props}) => {
    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (
            <EventEditor {...props} />
        );
    case ITEM_TYPE.PLANNING:
        return (
            <PlanningEditor {...props} />
        );
    }

    return null;
};

EditorContentTab.propTypes = {itemType: PropTypes.string};

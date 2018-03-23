import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../../utils';
import {ITEM_TYPE} from '../../../constants';
import {EventPreviewContent} from '../../Events/EventPreviewContent';
import {PlanningPreviewContent} from '../../Planning/PlanningPreviewContent';

export const PreviewContentTab = ({item}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (<EventPreviewContent />);
    case ITEM_TYPE.PLANNING:
        return (<PlanningPreviewContent />);
    default:
        return null;
    }
};

PreviewContentTab.propTypes = {
    item: PropTypes.object.isRequired,
};

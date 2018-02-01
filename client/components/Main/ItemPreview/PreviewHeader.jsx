import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../../constants';
import {EventPreviewHeader} from '../../Events';
import {PlanningPreviewHeader} from '../../Planning';
import {getItemType} from '../../../utils';

export const PreviewHeader = ({item}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (<EventPreviewHeader />);
    case ITEM_TYPE.PLANNING:
        return (<PlanningPreviewHeader />);
    default:
        return null;
    }
};

PreviewHeader.propTypes = {
    item: PropTypes.object.isRequired,
};

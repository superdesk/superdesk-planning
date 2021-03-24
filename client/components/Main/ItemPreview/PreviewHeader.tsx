import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../../constants';
import {EventPreviewHeader} from '../../Events';
import {PlanningPreviewHeader} from '../../Planning';
import {getItemType} from '../../../utils';

export const PreviewHeader = ({item, hideItemActions, showUnlock}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (
            <EventPreviewHeader
                hideItemActions={hideItemActions}
            />
        );
    case ITEM_TYPE.PLANNING:
        return (
            <PlanningPreviewHeader
                hideItemActions={hideItemActions}
                showUnlock={showUnlock}
            />
        );
    default:
        return null;
    }
};

PreviewHeader.propTypes = {
    item: PropTypes.object.isRequired,
    hideItemActions: PropTypes.bool,
    showUnlock: PropTypes.bool,
};

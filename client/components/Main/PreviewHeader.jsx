import React from 'react';
import PropTypes from 'prop-types';
import {EventPreviewHeader} from '../Events';
import {getItemType} from '../../utils';

export const PreviewHeader = ({item}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case 'events':
        return (<EventPreviewHeader />);
    default:
        return null;
    }
};

PreviewHeader.propTypes = {
    item: PropTypes.object.isRequired,
};

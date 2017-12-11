import React from 'react';
import PropTypes from 'prop-types';
import {EventPreviewHeader} from '../Events';
import {getItemType} from '../../utils';

export const PreviewHeader = ({item}) => (
    <div>
        {getItemType(item) === 'events' &&
            <EventPreviewHeader />
        }
    </div>
);

PreviewHeader.propTypes = {
    item: PropTypes.object.isRequired,
};

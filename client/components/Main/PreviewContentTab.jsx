import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../utils';

import {Row} from '../UI/Preview';
import {EventPreviewContent} from '../Events/EventPreviewContent'

export const PreviewContentTab = ({item}) => (
    <div>
        { getItemType(item) === 'events' &&
            <EventPreviewContent />
        }
    </div>
);

PreviewContentTab.propTypes = {
    item: PropTypes.object.isRequired,
};

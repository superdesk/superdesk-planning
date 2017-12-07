import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {Row} from '../UI/Preview';

export const PreviewContentTab = ({item}) => (
    <div>
        <Row
            label={gettext('Slugline')}
            value={item.slugline || ''}

            className="slugline"
        />
        <Row
            label={gettext('Name')}
            value={item.name || ''}
            className="strong"
        />
    </div>
);

PreviewContentTab.propTypes = {
    item: PropTypes.object.isRequired,
};

import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../utils';
import PreviewFormRow from './PreviewFormRow';

function PreviewContentTab({item}) {
    return (
        <div>
            <PreviewFormRow
                label={gettext('Slugline')}
                value={item.slugline || ''}

                className="slugline"
            />
            <PreviewFormRow
                label={gettext('Name')}
                value={item.name || ''}
                className="strong"
            />
        </div>
    );
}

PreviewContentTab.propTypes = {
    item: PropTypes.object.isRequired,
};

export default PreviewContentTab;

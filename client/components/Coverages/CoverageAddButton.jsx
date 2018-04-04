import React from 'react';
import PropTypes from 'prop-types';

import {gettext, planningUtils} from '../../utils';
import {PLANNING} from '../../constants';
import {Dropdown} from '../UI/SubNav';

export const CoverageAddButton = ({onAdd}) => {
    let items = [
        {
            label: PLANNING.G2_CONTENT_TYPE.TEXT,
            icon: planningUtils.getCoverageIcon(PLANNING.G2_CONTENT_TYPE.TEXT),
            action: onAdd.bind(null, PLANNING.G2_CONTENT_TYPE.TEXT),
        },
        {
            label: PLANNING.G2_CONTENT_TYPE.VIDEO,
            icon: planningUtils.getCoverageIcon(PLANNING.G2_CONTENT_TYPE.VIDEO),
            action: onAdd.bind(null, PLANNING.G2_CONTENT_TYPE.VIDEO),
        },
        {
            label: PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO.replace('_', ' '),
            icon: planningUtils.getCoverageIcon(PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO),
            action: onAdd.bind(null, PLANNING.G2_CONTENT_TYPE.LIVE_VIDEO),
        },
        {
            label: PLANNING.G2_CONTENT_TYPE.AUDIO,
            icon: planningUtils.getCoverageIcon(PLANNING.G2_CONTENT_TYPE.AUDIO),
            action: onAdd.bind(null, PLANNING.G2_CONTENT_TYPE.AUDIO),
        },
        {
            label: PLANNING.G2_CONTENT_TYPE.PICTURE,
            icon: planningUtils.getCoverageIcon(PLANNING.G2_CONTENT_TYPE.PICTURE),
            action: onAdd.bind(null, PLANNING.G2_CONTENT_TYPE.PICTURE),
        },
    ];

    return (
        <Dropdown
            icon="icon-plus-large"
            label={gettext('Coverage type')}
            items={items}
            alignRight
            dropUp
            navbtn={false}
            className="pull-right"
            tooltip={gettext('Create new coverage')}
        />
    );
};

CoverageAddButton.propTypes = {onAdd: PropTypes.func};

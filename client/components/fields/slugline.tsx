import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';

export const slugline = ({item}) => {
    if (!get(item, 'slugline', '')) {
        return null;
    }

    return (<span className="sd-list-item__slugline">{item.slugline}</span>);
};

slugline.propTypes = {
    item: PropTypes.shape({
        slugline: PropTypes.string,
    }).isRequired,
};

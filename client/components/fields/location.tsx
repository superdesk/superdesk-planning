import React from 'react';
import PropTypes from 'prop-types';

import {Location} from '../';

export const location = ({item}) => {
    const locations = Array.isArray(item.location) ? item.location : [item.location];

    if (locations.length === 0 || locations[0] == null) {
        return null;
    }

    const location = locations[0];

    return (
        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
            <Location
                name={location.name}
                address={location.formatted_address}
            />
        </span>
    );
};

location.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
};

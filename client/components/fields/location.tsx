import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {get} from 'lodash';

import {Location} from '../';

export const location = ({item, fieldsProps}) => {
    const locations = Array.isArray(item.location) ? item.location : [item.location];

    if (locations.length === 0 || locations[0] == null) {
        return null;
    }

    const location = locations[0];
    const locationProps = fieldsProps?.location ?? {};

    return (
        <span
            className={classNames('sd-overflow-ellipsis sd-list-item--element-grow',
                {'sd-list-item__element-lm-10': !get(locationProps, 'noMargin')})}
        >
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
    fieldsProps: PropTypes.object,
};

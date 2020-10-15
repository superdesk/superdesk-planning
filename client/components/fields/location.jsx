import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {get} from 'lodash';

import {Location} from '../';

export const location = ({item, fieldsProps}) => {
    const hasLocation = !!get(item, 'location.name') || !!get(item, 'location.formatted_address');
    const locationProps = get(fieldsProps, 'location');

    if (!hasLocation) {
        return null;
    }

    return (
        <span
            className={classNames('sd-overflow-ellipsis sd-list-item--element-grow',
                {'sd-list-item__element-lm-10': !get(locationProps, 'noMargin')})}
        >
            <Location
                name={get(item, 'location.name')}
                address={get(item, 'location.formatted_address')}
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

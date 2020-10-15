import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {formatAddress} from '../../utils';


export const LocationLookupResultItem = ({onClick, active, location}) => {
    const address = formatAddress(
        get(location, 'name') ? location : get(location, 'raw', {})
    );

    let name;

    if (get(location, 'existingLocation')) {
        name = get(location, 'name', '');

        if (get(address, 'formattedAddress')) {
            name += `, ${get(address, 'formattedAddress', '')}`;
        }
    } else {
        name = get(address, 'shortName', '');
    }

    return (
        <li
            onClick={onClick}
            className={classNames(
                'sd-list-item__row',
                'addgeolookup__item',
                {'addgeolookup__item--active': active}
            )}
        >
            <span className="sd-overflow-ellipsis">{name}</span>
        </li>
    );
};

LocationLookupResultItem.propTypes = {
    onClick: PropTypes.func,
    active: PropTypes.bool,
    location: PropTypes.shape({
        name: PropTypes.string,
        raw: PropTypes.object,
        existingLocation: PropTypes.bool,
    }),
};

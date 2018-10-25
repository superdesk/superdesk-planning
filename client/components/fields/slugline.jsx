import React from 'react';
import PropTypes from 'prop-types';

export const slugline = ({item}) => (
    item.slugline &&
        <span className="sd-list-item__slugline">{item.slugline}</span>
);

slugline.propTypes = {
    item: PropTypes.shape({
        slugline: PropTypes.string,
    }).isRequired,
};

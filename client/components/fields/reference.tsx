import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';

export const reference = ({item}) => {
    if (!get(item, 'reference', '')) {
        return null;
    }

    return (<span className="sd-list-item__text-strong">{item.reference}</span>);
};

reference.propTypes = {
    item: PropTypes.shape({
        reference: PropTypes.string,
    }).isRequired,
};
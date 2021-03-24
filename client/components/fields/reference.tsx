import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';

export const reference = ({item}) => {
    if (!get(item, 'reference', '')) {
        return null;
    }

    return (<span className="sd-list-item__text-strong sd-list-item__element-lm-10">{item.reference}</span>);
};

reference.propTypes = {
    item: PropTypes.shape({
        reference: PropTypes.string,
    }).isRequired,
};
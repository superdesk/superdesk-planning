import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';


export const files = ({item}) => {
    if (get(item, 'files.length', 0) <= 0) {
        return null;
    }

    return (<i className="icon-attachment" />);
};

files.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
};

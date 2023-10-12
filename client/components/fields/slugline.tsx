import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';

export const slugline = ({item, filterLanguage}: IFieldsProps) => {
    if (!get(item, 'slugline', '')) {
        return null;
    }

    return (
        <span className="sd-list-item__slugline">{getTranslatedValue(filterLanguage, item, 'slugline') ||
    item.slugline}</span>
    );
};

slugline.propTypes = {
    item: PropTypes.shape({
        slugline: PropTypes.string,
    }).isRequired,
    filterLanguage: PropTypes.string,
};

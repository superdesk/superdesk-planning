import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const OrderFieldInput = ({value, options, onChange}) => {
    const currentField = options.find((option) => option.id === value);
    const buttonLabel = get(currentField, 'label') || '';
    const items = options.map(
        (option) => ({
            id: option.id,
            label: option.label,
            action: onChange.bind(null, option.id),
        })
    );

    return (
        <Dropdown
            buttonLabel={gettext('Order By: {{ name }}', {name: buttonLabel})}
            items={items}
        />
    );
};

OrderFieldInput.propTypes = {
    value: PropTypes.string,
    options: PropTypes.array,
    onChange: PropTypes.func,
};

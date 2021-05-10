import React from 'react';
import PropTypes from 'prop-types';
import {getItemActionedStateLabel} from '../../utils';
import {Label} from '../';

export const actionedState = ({item, ...props}) => {
    const itemActionedState = getItemActionedStateLabel(item);

    if (!itemActionedState) {
        return null;
    }

    return (
        <Label
            text={itemActionedState.label}
            iconType={itemActionedState.iconType}
            tooltip={itemActionedState.tooltip}
            {...props}
        />
    );
};

actionedState.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
};

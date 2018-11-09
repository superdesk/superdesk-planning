import React from 'react';
import PropTypes from 'prop-types';
import {getItemWorkflowStateLabel} from '../../utils';
import {Label} from '../';

export const state = ({item}) => {
    const itemState = getItemWorkflowStateLabel(item);

    return (<Label text={gettext(itemState.label)} iconType={itemState.iconType} />);
};

state.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
};

import React from 'react';
import PropTypes from 'prop-types';

export const CheckboxGroup = ({children}) => (
    <div className="sd-check__group">{children}</div>
);

CheckboxGroup.propTypes = {
    children: PropTypes.node,
};

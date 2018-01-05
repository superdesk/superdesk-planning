import React from 'react';
import PropTypes from 'prop-types';

export const Box = ({children}) => (
    <div className="sd-column-box--2">
        {children}
    </div>
);

Box.propTypes = {children: PropTypes.node};

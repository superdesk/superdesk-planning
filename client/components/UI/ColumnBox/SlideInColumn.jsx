import React from 'react';
import PropTypes from 'prop-types';

export const SlideInColumn = ({children}) => (
    <div className="sd-column-box__slide-in-column">
        {children}
    </div>
);

SlideInColumn.propTypes = {children: PropTypes.node};

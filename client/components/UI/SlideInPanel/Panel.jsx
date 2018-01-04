import React from 'react';
import PropTypes from 'prop-types';

export const Panel = ({children}) => (
    <div className="sd-column-box__slide-in-column-inner sd-slide-in-panel">
        {children}
    </div>
);

Panel.propTypes = {children: PropTypes.node};

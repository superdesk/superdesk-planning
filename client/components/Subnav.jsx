import React from 'react';
import PropTypes from 'prop-types';

function Subnav({ children }) {
    return (
        <div className="subnav">
            {children}
        </div>
    );
}

Subnav.propTypes = {
    children: PropTypes.node,
};

export default Subnav;

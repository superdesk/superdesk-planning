import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const SidePanel = ({children, shadowRight, className}) => (
    <div className={classNames(
        'side-panel',
        {'side-panel--shadow-right': shadowRight},
        className
    )}>
        {children}
    </div>
);

SidePanel.propTypes = {
    children: PropTypes.node,
    shadowRight: PropTypes.bool,
    className: PropTypes.string,
};

SidePanel.defaultProps = {
    shadowRight: false,
    className: ''
};

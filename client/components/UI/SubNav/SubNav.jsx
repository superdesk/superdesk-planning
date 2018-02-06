import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const SubNav = ({children, className}) => (
    <div
        className={classNames(
            'subnav',
            className
        )}
    >
        {children}
    </div>
);

SubNav.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

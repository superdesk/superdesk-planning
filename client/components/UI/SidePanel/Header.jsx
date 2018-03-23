import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Header = ({children, className}) => (
    <div className={classNames(
        'side-panel__header',
        className
    )}>
        {children}
    </div>
);

Header.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

Header.defaultProps = {
    className: ''
};
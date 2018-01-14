import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const Footer = ({children, className}) => (
    <div className={classNames(
        'popup__menu-footer',
        className
    )}>
        {children}
    </div>
);

Footer.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Footer;

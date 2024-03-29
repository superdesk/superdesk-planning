import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Header
 * @description Header Component of a side panel
 */
export const Header = ({children, className, darkBlue, darker}) => (
    <div
        className={classNames(
            'side-panel__header',
            {
                'subnav--dark-blue-grey': darkBlue,
                'subnav--darker': darker,
            },
            className
        )}
    >
        <div className="side-panel__header-inner">
            {children}
        </div>
    </div>
);

Header.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    darkBlue: PropTypes.bool,
    darker: PropTypes.bool,
};

Header.defaultProps = {
    darkBlue: false,
    darker: false,
};

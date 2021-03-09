import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Subnav
 * @description Main Sub Nav component
 */
export const SubNav = ({children, className, darkBlue, darker, responsive, compact, testId, zIndex}) => (
    <div
        className={classNames(
            'subnav',
            {
                'subnav--dark-blue-grey': darkBlue,
                'subnav--darker': darker,
                'subnav--responsive': responsive,
                'compact--level-1': compact,
            },
            className
        )}
        data-test-id={testId}
        style={{zIndex: zIndex + ' !important'}}
    >
        {children}
    </div>
);

SubNav.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    darkBlue: PropTypes.bool,
    darker: PropTypes.bool,
    responsive: PropTypes.bool,
    compact: PropTypes.bool,
    testId: PropTypes.string,
    zIndex: PropTypes.number,
};

SubNav.defaultProps = {
    darkBlue: false,
    darker: false,
    responsive: false,
    compact: false,
};

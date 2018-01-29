import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

export const Toolbar = ({children, className, invalid}) => (
    <div className={classNames(
        'sd-slide-in-panel__header',
        {'sd-slide-in-panel__header--invalid': invalid},
        className
    )}>
        <div className="subnav__sliding-toolbar">
            <div className="sliding-toolbar__inner" />
            {children}
        </div>
    </div>
);

Toolbar.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    className: PropTypes.string,
    invalid: PropTypes.bool,
};

Toolbar.defaultProps = {
    children: [],
    invalid: false,
};

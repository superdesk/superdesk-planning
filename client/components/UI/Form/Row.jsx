import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

export const Row = ({children, flex, noPadding, className}) => (
    <div className={classNames(
        'form__row',
        {
            'form__row--flex': flex,
            'form__row--no-padding': noPadding
        },
        className
    )}>
        {children}
    </div>
);

Row.propTypes = {
    children: PropTypes.node,
    flex: PropTypes.bool,
    noPadding: PropTypes.bool,
    className: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
};

Row.defaultProps = {
    flex: false,
    noPadding: false,
};

Row.defaultProps = {showValue: true};

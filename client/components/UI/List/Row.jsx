import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Row = ({children, classes}) => (
    <div className={classNames(
        'sd-list-item__row',
        classes
    )}>
        {children}
    </div>
);

Row.propTypes = {
    children: PropTypes.node.isRequired,
    classes: PropTypes.string,
};

Row.defaultProps = {classes: ''};

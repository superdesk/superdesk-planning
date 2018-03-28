import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Row = ({children, classes, margin, marginTop}) => (
    <div className={classNames(
        'sd-list-item__row',
        classes,
        {
            'sd-list-item__row--no-margin': !margin,
            'sd-list-item__row--margin-top': marginTop,
        }
    )}>
        {children}
    </div>
);

Row.propTypes = {
    children: PropTypes.node.isRequired,
    classes: PropTypes.string,
    margin: PropTypes.bool,
    marginTop: PropTypes.bool,
};

Row.defaultProps = {
    classes: '',
    margin: true,
    marginTop: false,
};

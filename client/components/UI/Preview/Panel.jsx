import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Panel = ({children, className}) => (
    <div
        className={classNames(
            'sd-preview-panel',
            className
        )}
    >
        {children}
    </div>
);

Panel.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

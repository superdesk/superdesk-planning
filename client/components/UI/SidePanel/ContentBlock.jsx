import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const ContentBlock = ({children, className}) => (
    <div
        className={classNames(
            'side-panel__content-block',
            className
        )}
    >
        {children}
    </div>
);

ContentBlock.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};
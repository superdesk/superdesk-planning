import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Group = ({children, spaceBetween}) => (
    <div className={classNames(
        'sd-list-item-group',
        {'sd-list-item-group--space-between-items': spaceBetween}
    )}>
        {children}
    </div>
);

Group.propTypes = {
    children: PropTypes.node.isRequired,
    spaceBetween: PropTypes.bool,
};

Group.defaultProps = {spaceBetween: false};

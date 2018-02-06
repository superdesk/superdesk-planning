import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const ActionMenu = ({children, row}) => (
    <div className={classNames('sd-list-item__action-menu',
        {'sd-list-item__action-menu--direction-row': row})}>
        {children}
    </div>
);

ActionMenu.propTypes = {
    children: PropTypes.node.isRequired,
    row: PropTypes.bool,
};

ActionMenu.defaultProps = {row: true};

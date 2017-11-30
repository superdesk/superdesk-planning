import React from 'react';
import PropTypes from 'prop-types';

export const ActionMenu = ({children}) => (
    <div className="sd-list-item__action-menu">
        {children}
    </div>
);

ActionMenu.propTypes = {children: PropTypes.node.isRequired};

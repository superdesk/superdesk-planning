import React from 'react';
import PropTypes from 'prop-types';

export const Header = ({title, tools, children, onClose}) => (
    <div className="sd-slide-in-panel__header">
        <div className="subnav__sliding-toolbar">
            <div className="sliding-toolbar__inner" />
            {tools}
        </div>
        <h3 className="sd-slide-in-panel__heading">{title}</h3>
        {children}
    </div>
);

Header.propTypes = {
    title: PropTypes.string,
    tools: PropTypes.array,
    onClose: PropTypes.func,
    children: PropTypes.node,
};

Header.defaultProps = {tools: []};

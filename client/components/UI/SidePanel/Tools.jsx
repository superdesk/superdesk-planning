import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Tools = ({className, tools, children, topTools}) => (
    <div
        className={classNames(
            {
                'side-panel__tools': !topTools,
                'side-panel__top-tools': topTools,
            },
            className
        )}
    >
        {tools.map((tool) => (
            <a
                key={tool.icon}
                className="icn-btn"
                onClick={tool.onClick}
                data-sd-tooltip={tool.title}
                data-flow="left">
                <i className={tool.icon} />
            </a>
        ))}
        {children}
    </div>
);

Tools.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    tools: PropTypes.arrayOf(PropTypes.shape({
        icon: PropTypes.string,
        onClick: PropTypes.func,
        title: PropTypes.string,
    })).isRequired,
    topTools: PropTypes.bool,
};

Tools.defaultProps = {
    tools: [],
    topTools: false,
};

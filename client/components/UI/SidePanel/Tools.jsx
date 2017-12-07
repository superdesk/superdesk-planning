import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Tools = ({className, tools}) => (
    <div
        className={classNames(
            'side-panel__tools',
            className
        )}
    >
        {tools.map((tool) => (
            <a
                key={tool.icon}
                className="icn-btn"
                onClick={tool.onClick}>
                <i className={tool.icon} />
            </a>
        ))}
    </div>
);

Tools.propTypes = {
    className: PropTypes.string,
    tools: PropTypes.arrayOf(PropTypes.shape({
        icon: PropTypes.string,
        onClick: PropTypes.func
    })).isRequired,
};

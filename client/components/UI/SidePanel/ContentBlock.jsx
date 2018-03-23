import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const ContentBlock = ({children, className, padSmall, flex}) => (
    <div
        className={classNames(
            'side-panel__content-block',
            className,
            {
                'side-panel__content-block--pad-small': padSmall,
                'side-panel__content-block--flex': flex,
            }
        )}
    >
        {children}
    </div>
);

ContentBlock.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    padSmall: PropTypes.bool,
    flex: PropTypes.bool,
};

ContentBlock.defaultProps = {
    padSmall: false,
    flex: false,
};

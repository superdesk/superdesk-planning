import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name ContentBlock
 * @description Component to hold a single block of content
 */
export const ContentBlock = ({children, className, padSmall, flex, noPadding}) => (
    <div
        className={classNames(
            'side-panel__content-block',
            className,
            {
                'side-panel__content-block--pad-small': padSmall,
                'side-panel__content-block--flex': flex,
                'side-panel__content-block--no-padding': noPadding,
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
    noPadding: PropTypes.bool,
};

ContentBlock.defaultProps = {
    padSmall: false,
    flex: false,
};

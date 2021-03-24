import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Box
 * @description UI component with column-box styling
 */

export const Box = ({children, verticalScroll}) => (
    <div
        className={classNames('sd-column-box--2',
            {'sd-column-box--vertical-scroll': verticalScroll})}
    >
        {children}
    </div>
);

Box.propTypes = {
    children: PropTypes.node,
    verticalScroll: PropTypes.bool,
};

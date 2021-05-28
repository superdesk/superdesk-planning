import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Group
 * @description Component to group a list of items
 */
export const Group = ({
    className,
    children,
    spaceBetween,
    verticalScroll,
    style,
    onScroll,
    refNode,
    shadow,
    testId,
}) => (
    <div
        data-test-id={testId}
        className={classNames(
            className,
            'sd-list-item-group',
            shadow ? `sd-shadow--z${shadow}` : null,
            {
                'sd-list-item-group--space-between-items': spaceBetween,
                'sd-list-item-group--vertical-scroll': verticalScroll,
            }
        )}
        style={style}
        onScroll={onScroll}
        ref={refNode}
    >
        {children}
    </div>
);

Group.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    spaceBetween: PropTypes.bool,
    verticalScroll: PropTypes.bool,
    style: PropTypes.object,
    onScroll: PropTypes.func,
    refNode: PropTypes.func,
    shadow: PropTypes.oneOf([1, 2, 3, 4]),
    testId: PropTypes.string,
};

Group.defaultProps = {
    spaceBetween: false,
    verticalScroll: false,
    style: {},
};

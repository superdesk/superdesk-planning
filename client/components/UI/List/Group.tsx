import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Group
 * @description Component to group a list of items
 */
export const Group = (props) => {
    const {
        className,
        children,
        spaceBetween,
        verticalScroll,
        style,
        onScroll,
        refNode,
        shadow,
        testId,
        listBoxGroupProps,
        indexFrom,
    } = props;

    return (
        <div
            aria-labelledby={props['aria-labelledby']}
            data-test-id={testId}
            data-index-from={indexFrom}
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
            {...(listBoxGroupProps?.containerProps ?? {})}
        >
            {children}
        </div>
    );
};

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
    listBoxGroupProps: PropTypes.object,
    'aria-labelledby': PropTypes.string,

    /**
     * Active item index is shared between groups.
     * When focus goes to another group, active index needs to be set accordingly.
     * indexFrom indicates global index of the first item in a given group.
     */
    indexFrom: PropTypes.number,
};

Group.defaultProps = {
    spaceBetween: false,
    verticalScroll: false,
    style: {},
};

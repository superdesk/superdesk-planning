import React from 'react';
import classNames from 'classnames';

interface IProps {
    state?: false | 'success' | 'error' | 'locked' | 'active' | 'idle';
}

/**
 * Component to show border for a list item. Eg. red border for locked item
 */
export const Border: React.FunctionComponent<IProps> = ({state = false}) => (
    <div
        className={classNames(
            'sd-list-item__border',
            state ? `sd-list-item__border--${state}` : null
        )}
    />
);


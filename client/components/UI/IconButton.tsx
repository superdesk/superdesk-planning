import React from 'react';
import classNames from 'classnames';

import {KEYCODES} from './constants';
import {onEventCapture} from './utils';

import {Icon} from './';

interface IProps extends React.HTMLAttributes<HTMLButtonElement> {
    onClick?: () => void;
    tabIndex?: number;
    onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    enterKeyIsClick?: boolean;
    icon?: string;
    useDefaultClass?: boolean;
    className?: string;
    label?: string;
    tooltip?: string;
    tooltipDirection?: string;
    testId?: string;
    refNode?: React.LegacyRef<HTMLButtonElement>;
}

/**
 * @ngdoc react
 * @name IconButton
 * @description Icon with Button component
 */
const IconButton: React.FC<IProps> = ({
    onClick,
    tabIndex,
    onKeyDown,
    onFocus,
    enterKeyIsClick = false,
    icon,
    useDefaultClass = true,
    className,
    label,
    tooltip,
    tooltipDirection = 'down',
    testId,
    refNode,
    ...props
}) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            onClick?.();
            return;
        }

        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    return (
        <button
            className={classNames(
                {'icn-btn': useDefaultClass},
                className
            )}
            onClick={onClick}
            onFocus={onFocus}
            tabIndex={tabIndex}
            onKeyDown={enterKeyIsClick ? handleKeyDown : onKeyDown}
            data-sd-tooltip={tooltip}
            data-flow={tooltipDirection}
            data-test-id={testId}
            {...props}
            ref={refNode}
        >
            <Icon icon={icon} />
            {label}
        </button>
    );
};

export default IconButton;

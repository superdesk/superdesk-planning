import React from 'react';

import {ButtonStack} from './ButtonStack';

interface IButtonProps {
    children?: React.ReactNode;
    className?: string;
    right?: boolean;
    buttonClassName?: string;
    onClick?: () => void;
    padded?: boolean;
    testId?: string;
    disabled?: boolean;
}

/**
 * @ngdoc react
 * @name Button
 * @description Button of a Sub Nav bar
 */
export const Button: React.FC<IButtonProps> = ({
    children,
    className,
    right = false,
    buttonClassName,
    onClick,
    padded = false,
    testId,
    disabled,
}) => (
    <ButtonStack
        right={right}
        padded={padded}
        className={className}
    >
        <button className={buttonClassName} onClick={onClick} data-test-id={testId} disabled={disabled}>
            {children}
        </button>
    </ButtonStack>
);

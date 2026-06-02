import React from 'react';
import classNames from 'classnames';

interface IProps {
    label?: string,
    value?: string | number | React.ReactNode,
    className?: string,
    children?: React.ReactNode,
    noPadding?: boolean,
    enabled?: boolean,
    flex?: boolean,
    rowItem?: boolean,
    dataTestId?: string,
}
/**
 * Row Component to be used in an item preview to show an item's detail
 */
export const Row: React.FunctionComponent<IProps> = ({
    label,
    value,
    className,
    children,
    noPadding,
    enabled = true,
    flex,
    rowItem,
    dataTestId,
}) => (
    enabled ? (
        <div
            className={classNames(
                {
                    form__row: !rowItem,
                    'form__row-item': rowItem,
                    'no-padding': noPadding,
                    'form__row--flex': flex,
                    [className]: className && !value,
                }
            )}
            data-test-id={dataTestId}
        >
            {label && <label className="form-label form-label--light">{label}</label>}
            {value && <p className={'sd-text__' + className}>{value}</p>}
            {children}
        </div>
    ) :
        null
);

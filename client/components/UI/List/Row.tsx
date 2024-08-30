import React, {CSSProperties} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    children: Array<JSX.Element> | JSX.Element;
    classes?: string;
    paddingBottom?: boolean;
    testId?: string;
    style?: CSSProperties;
}

/**
 * @ngdoc react
 * @name Row
 * @description Row Component in a list of item where each item is a row
 */
export const Row = ({children, classes = '', paddingBottom, testId, style}: IProps) => (
    <div
        className={classNames(
            'sd-list-item__row',
            classes,
            {
                'sd-list-item__row--padding-b5': paddingBottom,
            }
        )}
        data-test-id={testId}
        style={style}
    >
        {children}
    </div>
);

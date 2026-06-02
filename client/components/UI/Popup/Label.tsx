import React from 'react';
import classNames from 'classnames';

import {gettextCatalog} from '../utils';

interface IProps {
    text: string;
    centerText: boolean;
    children?: React.ReactNode;
}

const Label = ({text, children, centerText = false}: IProps) => {
    return (
        <span
            className={classNames(
                'popup__menu-label',
                {'popup__menu-label--center': centerText}
            )}
        >
            {gettextCatalog(text)}
            {children}
        </span>
    );
};

export default Label;

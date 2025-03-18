import React from 'react';
import classNames from 'classnames';

import {gettextCatalog} from '../utils';

interface IProps {
    text: string;
    children: React.ReactNode;
    centerText: boolean;
}

const Label = ({text, children, centerText}: IProps) => {
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

Label.defaultProps = {centerText: false};

export default Label;

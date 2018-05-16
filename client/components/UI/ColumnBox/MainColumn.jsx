import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

export const MainColumn = ({children, padded, verticalScroll}) => (
    <div className={classNames(
        'sd-column-box__main-column',
        {'sd-column-box__main-column--padded': padded},
        {'sd-column-box__main-column--vertical-scroll': verticalScroll}
    )} >
        {children}
    </div>
);

MainColumn.propTypes = {
    children: PropTypes.node,
    padded: PropTypes.bool,
    verticalScroll: PropTypes.bool,
};

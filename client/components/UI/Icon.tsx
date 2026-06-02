import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {values} from 'lodash';
import {Tooltip} from 'superdesk-ui-framework/react';

import {ICON_COLORS} from './constants';

/**
 * @ngdoc react
 * @name Icon
 * @description Generic Icon component with tooltip
 */
const Icon = ({icon, doubleSize, big, className, tooltip, color}) => {
    const iconElement = (
        <i
            className={classNames(
                icon,
                {
                    'icon--2x': doubleSize,
                    'double-size-icn': big,
                    [color]: color,
                },
                className
            )}
        />
    );

    return tooltip ? (
        <Tooltip content={tooltip}>
            {iconElement}
        </Tooltip>
    ) :
        iconElement;
};

Icon.propTypes = {
    icon: PropTypes.string,
    big: PropTypes.bool,
    doubleSize: PropTypes.bool,
    className: PropTypes.string,
    tooltip: PropTypes.string,
    color: PropTypes.oneOf(values(ICON_COLORS)),
};

Icon.defaultProps = {
    big: false,
    doubleSize: false,
};

export default Icon;

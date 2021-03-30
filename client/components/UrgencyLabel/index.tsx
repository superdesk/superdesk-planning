import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

export const UrgencyLabel = ({item, urgencies, label, tooltipFlow, className, inline}) => {
    const qcode = get(item, 'urgency', null);

    if (!qcode) {
        return null;
    }

    const urgency = urgencies.find((u) => u.qcode === qcode);

    return (
        <span
            className={classNames(
                'urgency-label',
                'urgency-label--' + qcode,
                {'sd-list-item__inline-icon': inline},
                className
            )}
            data-sd-tooltip={label + ': ' + urgency.name}
            data-flow={tooltipFlow}
        >
            {urgency.qcode}
        </span>
    );
};

UrgencyLabel.propTypes = {
    item: PropTypes.object,
    urgencies: PropTypes.array,
    label: PropTypes.string,
    tooltipFlow: PropTypes.oneOf(['up', 'right', 'down', 'left']),
    className: PropTypes.string,
    inline: PropTypes.bool,
};

UrgencyLabel.defaultProps = {
    tooltipFlow: 'right',
    inline: false,
};

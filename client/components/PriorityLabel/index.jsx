import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

export const PriorityLabel = ({item, priorities, tooltipFlow, inline, className}) => {
    const qcode = get(item, 'priority', null);

    if (!qcode) {
        return null;
    }

    const priority = priorities.find((p) => p.qcode === qcode);

    return (
        <span
            className={classNames(
                'priority-label',
                'priority-label--' + qcode,
                {'sd-list-item__inline-icon': inline},
                className
            )}
            data-sd-tooltip={`Priority: ${priority.name}`}
            data-flow={tooltipFlow}
        >
            {priority.qcode}
        </span>
    );
};

PriorityLabel.propTypes = {
    item: PropTypes.object,
    priorities: PropTypes.array,
    tooltipFlow: PropTypes.oneOf(['up', 'right', 'down', 'left']),
    inline: PropTypes.bool,
    className: PropTypes.string,
};

PriorityLabel.defaultProps = {
    tooltipFlow: 'right',
    inline: false,
};

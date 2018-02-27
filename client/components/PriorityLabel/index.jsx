import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

export const PriorityLabel = ({item, priorities, tooltipFlow, className}) => {
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
    className: PropTypes.string,
};

PriorityLabel.defaultProps = {tooltipFlow: 'right'};

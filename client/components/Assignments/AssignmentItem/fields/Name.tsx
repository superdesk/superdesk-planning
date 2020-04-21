import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    assignment: any;
    api: any;
}

export const NameComponent = ({assignment, api}: IProps) => {
    const [name, setName] = React.useState(null);

    if (name === null) {
        // Retrieve full item from id
        api.find('planning', assignment.planning_item).then((planningItem) => {
            setName(planningItem.name || '');
        });

        return null;
    }

    return (
        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
            <span>{name}</span>
        </span>
    );
};

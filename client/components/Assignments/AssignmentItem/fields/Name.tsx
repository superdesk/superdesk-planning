import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    assignment: any;
    fetchPlanningItemForAssignment: any;
}

export const NameComponent = ({
    assignment,
    fetchPlanningItemForAssignment,
}: IProps) => {
    const [name, setName] = React.useState(null);

    if (name === null) {
        // Retrieve full item from id
        fetchPlanningItemForAssignment(assignment).then((planningItem) => {
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

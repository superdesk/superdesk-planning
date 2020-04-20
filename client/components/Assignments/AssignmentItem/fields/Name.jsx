import React from 'react';
import {get} from 'lodash';

export const NameComponent = ({assignment, api}) => {
    const [name, setName] = React.useState(null);

    if (name === null) {
        // Retrieve full item from id
        api.find('planning', assignment.planning_item).then((planningItem) => {
            console.log(assignment);
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

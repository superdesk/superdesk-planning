import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    assignment: any;
    loadArchiveItem: (assignment) => any;
}

export const HeadlineComponent = ({assignment, loadArchiveItem}: IProps) => {
    const itemIds = assignment.item_ids;

    if (!itemIds) {
        return null;
    }

    const itemId = assignment.item_ids[0];

    if (!itemId) {
        return null;
    }

    const [item, setItem] = React.useState(null);

    if (!item) {
        loadArchiveItem(assignment).then(setItem);
        return null;
    }

    return <span>{item.headline}</span>;
};

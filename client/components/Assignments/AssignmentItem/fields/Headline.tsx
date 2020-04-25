import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    assignment: any;
    archiveItemForAssignment: {[assignmentId: string]: any}
}

export const HeadlineComponent = ({assignment, archiveItemForAssignment}: IProps) => {
    const item = archiveItemForAssignment?.[assignment._id];

    if (!item) {
        return null;
    }

    return <span>{item.headline}</span>;
};

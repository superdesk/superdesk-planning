import React from 'react';
import {IAssignmentItem} from 'interfaces';
import {IArticle} from 'superdesk-api';

interface IProps {
    assignment: IAssignmentItem;
    archiveItemForAssignment: {[assignmentId: string]: IArticle}
}

export const HeadlineComponent = ({assignment, archiveItemForAssignment}: IProps) => {
    const archiveItem = archiveItemForAssignment?.[assignment._id];
    const coverageHeadline = assignment.planning?.headline;

    if ((archiveItem?.headline ?? '').trim().length > 0) {
        return <span>{archiveItem.headline}</span>;
    }

    if ((coverageHeadline ?? '').trim().length > 0) {
        return <span>{coverageHeadline}</span>;
    }

    return null;
};

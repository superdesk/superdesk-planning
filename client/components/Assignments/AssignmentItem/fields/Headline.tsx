import React from 'react';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';
import {IArticle} from 'superdesk-api';

type IProps = IAssignmentListItemField;

export const HeadlineComponent = ({assignment, ...props}: IProps) => {
    const archiveItems: {[_id: IArticle['_id']]: IArticle} = props.fieldsProps.headline.archiveItems ?? {};
    const archiveItem: IArticle = Object.values(archiveItems)
        .find((item: IArticle) => item.assignment_id === assignment._id);

    const coverageHeadline = assignment.planning?.headline;

    if ((archiveItem?.headline ?? '').trim().length > 0) {
        return <span>{archiveItem.headline}</span>;
    }

    if ((coverageHeadline ?? '').trim().length > 0) {
        return <span>{coverageHeadline}</span>;
    }

    return null;
};

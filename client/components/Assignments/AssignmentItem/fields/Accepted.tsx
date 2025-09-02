import React from 'react';
import {Label} from '../../..';
import {gettext} from '../../../../utils';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const AcceptedComponent = ({assignment}: IProps) => {
    const isAccepted = assignment?.accepted ?? false;

    if (!isAccepted) {
        return null;
    }

    return <Label iconType="highlight" text={gettext('Accepted')} />;
};

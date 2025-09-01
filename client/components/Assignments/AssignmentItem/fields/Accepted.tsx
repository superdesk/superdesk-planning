import React from 'react';
import {get} from 'lodash';
import {Label} from '../../..';
import {gettext} from '../../../../utils';
import {IAssignmentItem} from 'interfaces';

interface IProps {
    assignment: IAssignmentItem;
}

export const AcceptedComponent = ({assignment}: IProps) => {
    const isAccepted = get(assignment, 'accepted');

    if (!isAccepted) {
        return null;
    }

    return <Label iconType="highlight" text={gettext('Accepted')} />;
};

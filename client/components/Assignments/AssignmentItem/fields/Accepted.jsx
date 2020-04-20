import React from 'react';
import {get} from 'lodash';
import {Label} from '../../..';

export const AcceptedComponent = ({assignment}) => {
    const isAccepted = get(assignment, 'accepted');

    if (!isAccepted) {
        return null;
    }

    return <Label iconType="highlight" text={gettext('Accepted')} />;
};

import React from 'react';

import {PlanningDateTime} from '../Planning';
import {IDesk, IUser} from 'superdesk-api';
import {IContactItem, IFieldsProps, IG2ContentType} from 'interfaces';
import {isPlanning} from '../../utils';

interface IProps extends IFieldsProps {
    fieldsProps: {
        coverages: {
            date: string;
            users: Array<IUser>;
            desks: Array<IDesk>;
            activeFilter: string;
            contentTypes: Array<IG2ContentType>;
            contacts: IContactItem;
            filterLanguage: string;
        };
    };
}

export const coverages: React.FunctionComponent<IProps> = ({
    item,
    fieldsProps,
}) => {
    if (fieldsProps?.coverages == null) {
        return null;
    }

    const {
        date,
        users,
        desks,
        activeFilter,
        contentTypes,
        contacts,
        filterLanguage,
    } = fieldsProps.coverages;

    if (!isPlanning(item)) {
        return null;
    }

    return (
        <PlanningDateTime
            filterLanguage={filterLanguage}
            item={item}
            date={date}
            users={users}
            desks={desks}
            activeFilter={activeFilter}
            contentTypes={contentTypes}
            contacts={contacts}
        />
    );
};

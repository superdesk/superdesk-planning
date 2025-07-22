import React from 'react';
import {IFieldsProps} from '../../interfaces';
import {isEvent} from '../../utils';
import {EventDateTime} from '../../components/Events';

interface IProps extends IFieldsProps {
    fieldsProps: {
        event_datetime?: {
            isEventAndPlanningSameDate?: boolean;
            hideStartDate?: boolean;
        };
    };
}

export const event_datetime: React.ComponentType<IProps> = (props) => {
    const {item} = props;

    if (!isEvent(item)) {
        return null;
    }

    return (
        <EventDateTime
            item={item}
            isEventAndPlanningSameDate={props?.fieldsProps?.event_datetime?.isEventAndPlanningSameDate}
            hideStartDate={props?.fieldsProps?.event_datetime?.hideStartDate}
        />
    );
};

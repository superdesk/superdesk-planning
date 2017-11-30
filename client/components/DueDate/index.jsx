import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {Datetime} from '../index';

export const DueDate = ({dates}) => {
    let dueDates = dates.map((d) => moment(d));

    if (dueDates.length === 1) {
        return <Datetime date={dueDates[0]}/>;
    } else if (dueDates.length > 1) {
        const startDate = moment.min(dueDates);
        const endDate = moment.max(dueDates);

        if (endDate.isSame(startDate, 'day')) {
            return (
                <span>
                    <Datetime date={startDate} withTime={false}/>&nbsp;
                    <Datetime date={startDate} withDate={false}/>,&nbsp;
                    <Datetime date={endDate} withDate={false}/>
                </span>
            );
        } else {
            return (
                <span>
                    <Datetime date={startDate} withYear={false} />&nbsp;-&nbsp;
                    <Datetime date={endDate}/>
                </span>
            );
        }
    }
};

DueDate.propTypes = {dates: PropTypes.array};

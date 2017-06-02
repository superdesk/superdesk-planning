import React from 'react'
import moment from 'moment'
import { Datetime } from '../index'

export const DueDate = ({ dates }) => {
    dates = dates.map((d) => moment(d))
    if (dates.length === 1) {
        return <Datetime date={dates[0]}/>
    } else if (dates.length > 1) {
        const startDate = moment.min(dates)
        const endDate = moment.max(dates)
        if (endDate.isSame(startDate, 'day')) {
            return (
                <span>
                    <Datetime date={startDate} withTime={false}/>&nbsp;
                    <Datetime date={startDate} withDate={false}/>,&nbsp;
                    <Datetime date={endDate} withDate={false}/>
                </span>
            )
        } else {
            return (
                <span>
                    <Datetime date={startDate} withYear={false} />&nbsp;-&nbsp;
                    <Datetime date={endDate}/>
                </span>
            )
        }
    }
}

DueDate.propTypes = { dates: React.PropTypes.array }

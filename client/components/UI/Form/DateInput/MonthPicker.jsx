import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';
import {chunk} from 'lodash';
import './style.scss';

export const MonthPicker = ({selectedDate, onChange}) => {
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY',
        'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const rows = chunk(monthNames, 3);

    return (
        <table>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((date, index) => (
                            <td key={index} className="text-center">
                                <button
                                    type="button"
                                    className={classNames(
                                        'btn',
                                        'btn-default',
                                        'btn-sm',
                                        {active: (rowIndex * 3 + index) === selectedDate.month()}
                                    )}
                                    onClick={
                                        onChange.bind(this, (moment(selectedDate).month((rowIndex * 3 + index))))
                                    }>
                                    <span>{date}</span>
                                </button>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

MonthPicker.propTypes = {
    selectedDate: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};

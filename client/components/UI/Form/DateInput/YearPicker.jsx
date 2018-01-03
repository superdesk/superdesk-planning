import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';
import {range, chunk} from 'lodash';
import './style.scss';

export const YearPicker = ({selectedDate, onChange, startingYear, yearRange}) => {
    const yRange = yearRange || 20;
    const years = range(startingYear, startingYear + yRange); // plus one to include the last number as welln
    const rows = chunk(years, 5);

    return (
        <table>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((year, index) => (
                            <td key={index} className="text-center">
                                <button
                                    type="button"
                                    className={classNames(
                                        'btn',
                                        'btn-default',
                                        'btn-sm',
                                        {active: (startingYear + (rowIndex * 5 + index)) === selectedDate.year()}
                                    )}
                                    onClick={
                                        onChange.bind(this,
                                            (moment(selectedDate).year((startingYear + (rowIndex * 5 + index)))))
                                    }>
                                    <span>{year}</span>
                                </button>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

YearPicker.propTypes = {
    selectedDate: PropTypes.object.isRequired,
    startingYear: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    yearRange: PropTypes.number,
};

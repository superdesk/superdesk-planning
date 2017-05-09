import React, { PropTypes } from 'react'
import moment from 'moment'
import { range, chunk } from 'lodash'
import './styles.scss'

export const YearPicker = ({ selectedDate, onChange, startingYear, yearRange }) => {
    const yRange = yearRange || 20
    const years = range(startingYear, startingYear + yRange) // plus one to include the last number as welln
    const rows = chunk(years, 5)
    return (
        <table>
            <tbody>
                {rows.map((row, rowIndex) => {
                    return (
                        <tr key={rowIndex}>
                            {row.map((year, index) => (
                                <td key={index} className='text-center'>
                                    <button type="button" className={((startingYear + (rowIndex * 5 + index)) === selectedDate.year() ? 'active' :
                                        '') + ' btn btn-default btn-sm'} onClick={onChange.bind(this, (moment(selectedDate).year((startingYear + (rowIndex * 5 + index)))))}>
                                        <span>{year}</span>
                                    </button>
                                </td>
                            ))}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

YearPicker.propTypes = {
    selectedDate: PropTypes.object.isRequired,
    startingYear: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    yearRange: PropTypes.number,
}

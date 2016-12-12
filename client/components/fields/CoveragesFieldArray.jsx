import { Coverage } from '../index'
import React from 'react'

export const CoveragesFieldArray = ({ fields }) => (
    <ul>
        {fields.map((coverage, index) => (
            <li key={index}>
                <Coverage coverage={coverage} />
            </li>
        ))}
        <li>
            <button
                className="btn btn-default"
                onClick={() => fields.push({})}
                type="button">Add</button>
        </li>
    </ul>
)
CoveragesFieldArray.propTypes = {
    fields: React.PropTypes.object.isRequired,
}

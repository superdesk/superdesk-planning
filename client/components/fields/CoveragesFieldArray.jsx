import { Coverage } from '../index'
import React from 'react'

export const CoveragesFieldArray = ({ fields }) => (
    <ul>
        {fields.map((coverage, index) => (
            <li key={index} className="Coverage">
                <button
                    onClick={()=>fields.remove(index)}
                    title="Remove coverage"
                    className="Coverage__remove">
                    <i className="icon-trash" />
                </button>
                <Coverage coverage={coverage} />
            </li>
        ))}
        <li>
            <button
                className="Coverage__add-btn btn btn-default"
                onClick={() => fields.push({})}
                type="button">
                <i className="icon-plus-large"/>
            </button>
        </li>
    </ul>
)
CoveragesFieldArray.propTypes = {
    fields: React.PropTypes.object.isRequired,
}

import { Coverage } from '../index'
import React from 'react'

export const CoveragesFieldArray = ({ fields, readOnly }) => (
    <ul className="Coverage__list">
        {fields.map((coverage, index) => (
            <li key={index} className="Coverage__item">
                { !readOnly &&  <button
                    onClick={()=>fields.remove(index)}
                    title="Remove coverage"
                    type="button"
                    className="Coverage__remove">
                    <i className="icon-trash" />
                </button> }
                <Coverage coverage={coverage} readOnly={readOnly} />
            </li>
        ))}
        <li>
            { !readOnly && <button
                className="Coverage__add-btn btn btn-default"
                onClick={() => fields.push({})}
                type="button" >
                <i className="icon-plus-large"/>
            </button> }
        </li>
    </ul>
)
CoveragesFieldArray.propTypes = {
    fields: React.PropTypes.object.isRequired,
    readOnly: React.PropTypes.bool,
}

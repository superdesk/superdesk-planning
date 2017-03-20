import React from 'react'
import { LinkField } from './index'

export const LinksFieldArray = ({ fields }) => (
    <ul>
        {fields.map((fieldName, index) => (
            <LinkField
                key={index}
                fieldName={fieldName}
                onRemove={()=>fields.remove(index)}
                link={fields.get(index)}/>
        ))}
        <li>
            { fields.length ? <br/> : '' }
            <button
                className="Link__add-btn btn btn-default"
                onClick={() => fields.push()}
                type="button">
                Add a link
            </button>
        </li>
    </ul>
)

LinksFieldArray.propTypes = { fields: React.PropTypes.object.isRequired }

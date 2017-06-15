import React from 'react'
import { LinkField } from './index'

export const LinksFieldArray = ({ fields, readOnly }) => {
    return (
        <ul>
            {fields.map((fieldName, index) => (
                <LinkField
                    key={index}
                    fieldName={fieldName}
                    onRemove={()=>fields.remove(index)}
                    link={fields.get(index)}
                    readOnly={readOnly}/>
            ))}
            <li>
                { fields.length ? <br/> : '' }
                {!readOnly && <button
                    className="Link__add-btn btn btn-default"
                    onClick={() => fields.push()}
                    type="button" >
                    Add a link
                </button>}
            </li>
        </ul>
    )
}

LinksFieldArray.propTypes = {
    fields: React.PropTypes.object.isRequired,
    readOnly: React.PropTypes.bool,
}

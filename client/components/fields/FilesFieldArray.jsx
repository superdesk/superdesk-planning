import React from 'react'
import { FileField } from './index'

export const FilesFieldArray = ({ fields }) => (
    <ul className="File__list">
        {fields.map((fieldName, index) => (
            <FileField
                key={index}
                fieldName={fieldName}
                file={fields.get(index)}
                onRemove={()=>fields.remove(index)}/>
        ))}
        <li>
            <button
                className="File__add-btn btn btn-default"
                onClick={() => fields.push({})}
                type="button">
                Add a file
            </button>
        </li>
    </ul>
)

FilesFieldArray.propTypes = { fields: React.PropTypes.object.isRequired }

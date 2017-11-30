import React from 'react';
import PropTypes from 'prop-types';
import {FileField} from './index';

export const FilesFieldArray = ({fields, readOnly}) => (
    <ul className="File__list">
        {fields.map((fieldName, index) => (
            <FileField
                key={index}
                fieldName={fieldName}
                file={fields.get(index)}
                onRemove={() => fields.remove(index)}
                readOnly={readOnly} />
        ))}
        <li>
            {!readOnly && <button
                className="File__add-btn btn btn-default"
                onClick={() => fields.push({})}
                type="button">
                    Add a file
            </button>}
        </li>
    </ul>
);

FilesFieldArray.propTypes = {
    fields: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
};

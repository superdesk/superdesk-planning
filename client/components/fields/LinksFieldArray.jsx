import React from 'react';
import PropTypes from 'prop-types';
import {LinkField} from './index';

export const LinksFieldArray = ({fields, readOnly}) => (
    <ul>
        {fields.map((fieldName, index) => (
            <LinkField
                key={index}
                fieldName={fieldName}
                onRemove={() => fields.remove(index)}
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
);

LinksFieldArray.propTypes = {
    fields: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
};

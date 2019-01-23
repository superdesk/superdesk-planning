import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../utils';

import {
    SelectMetaTermsInput,
    Field,
} from './UI/Form';

export default function CustomVocabulariesFields(
    {customVocabularies, fieldProps, onFocusDetails, formProfile, popupProps, popupContainer}
) {
    return customVocabularies
        .filter((cv) => get(formProfile, `editor.${cv._id}.enabled`))
        .map((cv) => (
            <Field key={cv._id}
                enabled={true} // avoid further checks in Field
                component={SelectMetaTermsInput}
                field={cv.schema_field || 'subject'}
                profileName={cv._id}
                label={gettext(cv.display_name)}
                options={cv.items.map((item) => Object.assign({scheme: cv._id}, item))}
                defaultValue={[]}
                {...fieldProps}
                onFocus={onFocusDetails}
                scheme={cv._id}
                popupContainer={popupContainer}
                {...popupProps}
            />
        ));
}

CustomVocabulariesFields.propTypes = {
    customVocabularies: PropTypes.array.isRequired,
    fieldsProps: PropTypes.object,
    onFocusDetails: PropTypes.func,
    formProfile: PropTypes.object.isRequired,
    popupContainer: PropTypes.node,
    popupProps: PropTypes.object,
};
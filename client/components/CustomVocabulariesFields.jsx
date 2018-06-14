import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../utils';

import {
    SelectMetaTermsInput,
    Field,
} from './UI/Form';


export default function CustomVocabulariesFields({customVocabularies, fieldProps, onFocusDetails}) {
    return customVocabularies.map((cv) => (
        <Field key={cv._id}
            component={SelectMetaTermsInput}
            field="subject"
            label={gettext(cv.display_name)}
            options={cv.items.map((item) => Object.assign({scheme: cv._id}, item))}
            defaultValue={[]}
            {...fieldProps}
            onFocus={onFocusDetails}
            scheme={cv._id}
        />
    ));
}

CustomVocabulariesFields.propTypes = {
    customVocabularies: PropTypes.array.isRequired,
    fieldsProps: PropTypes.object,
    onFocusDetails: PropTypes.func,
};
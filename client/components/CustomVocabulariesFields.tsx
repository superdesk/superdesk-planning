import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {gettext} from '../utils';

import {
    SelectMetaTermsInput,
    Field,
} from './UI/Form';

export default function CustomVocabulariesFields(
    {customVocabularies, fieldProps, onFocusDetails, formProfile, popupProps, popupContainer}
) {
    const {
        errors,
        diff,
    } = fieldProps;
    const language = get(diff, 'language') || getUserInterfaceLanguage();

    return customVocabularies
        .filter((cv) => get(formProfile, `editor.${cv._id}.enabled`))
        .map((cv) => (
            <Field
                key={cv._id}
                enabled={true} // avoid further checks in Field
                component={SelectMetaTermsInput}
                field={cv.schema_field || 'subject'}
                profileName={cv._id}
                label={gettext(cv.display_name)}
                options={cv.items.map((item) => Object.assign({scheme: cv._id}, item))}
                defaultValue={[]}
                error={get(errors, cv._id)}
                {...fieldProps}
                onFocus={onFocusDetails}
                scheme={cv._id}
                popupContainer={popupContainer}
                language={language}
                {...popupProps}
            />
        ));
}

CustomVocabulariesFields.propTypes = {
    customVocabularies: PropTypes.array.isRequired,
    fieldsProps: PropTypes.object,
    onFocusDetails: PropTypes.func,
    formProfile: PropTypes.object.isRequired,
    popupContainer: PropTypes.func,
    popupProps: PropTypes.object,
};
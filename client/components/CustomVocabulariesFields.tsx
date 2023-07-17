import * as React from 'react';
import {get} from 'lodash';

import {IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../superdeskApi';

import {getUserInterfaceLanguageFromCV} from '../utils/users';
import {SelectMetaTermsInput, Field} from './UI/Form';

interface IProps {
    testId?: string;
    customVocabularies: Array<IVocabulary>;
    fieldProps: any;
    popupProps: any;
    language: string;
    onFocusDetails?(): void;
    popupContainer?(): HTMLElement;
}

export default class CustomVocabulariesFields extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            customVocabularies,
            fieldProps,
            onFocusDetails,
            popupProps,
            popupContainer,
            testId,
        } = this.props;

        const {
            errors,
        } = fieldProps;

        const language = this.props.language ?? getUserInterfaceLanguageFromCV();

        return customVocabularies
            .map((cv) => (
                <Field
                    key={cv._id}
                    testId={testId?.length ? `${testId}_${cv._id}` : cv._id}
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
                    noMargin={true}
                    {...popupProps}
                />
            ));
    }
}

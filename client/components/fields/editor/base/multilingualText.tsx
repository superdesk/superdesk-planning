import * as React from 'react';
import {isEqual, get} from 'lodash';

import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';
import {planningApi, superdeskApi} from '../../../../superdeskApi';

import {ContentDivider} from 'superdesk-ui-framework/react';
import {EditorFieldDynamicTextType} from './dynamicTextTypeField';

export interface IMultilingualTextProps extends IEditorFieldProps {
    schema?: IProfileSchemaTypeString;
    showAllLanguages: boolean;
}

interface IState {
    fields: {[key: string]: string};
}

export class EditorFieldMultilingualText extends React.Component<IMultilingualTextProps, IState> {
    constructor(props: IMultilingualTextProps) {
        super(props);

        this.state = {fields: this.getFieldStates()};
        this.onChange = this.onChange.bind(this);
    }

    componentDidUpdate(prevProps: Readonly<IMultilingualTextProps>, prevState: Readonly<IState>, snapshot?: any) {
        if (!(isEqual(prevProps.item.translations, this.props.item.translations))) {
            // Remove any local state for languages no longer for this item
            this.updateFieldState();
        }
    }

    updateFieldState() {
        this.setState({fields: this.getFieldStates()});
    }

    getFieldStates(): IState['fields'] {
        const multilingualConfig = planningApi.contentProfiles.multilingual.getConfig(this.props.profile?.name);

        if (multilingualConfig.isEnabled === false) {
            return {};
        }

        const translations = (this.props.item?.translations ?? [])
            .filter((entry) => (entry.field === this.props.field))
            .reduce((fields, entry) => {
                fields[entry.language] = entry.value;

                return fields;
            }, {});

        // If the entry for the default language has not been assigned to the item
        // then this item may have been created before multilingual functionality
        // therefor show the value from the parent field
        if (translations[multilingualConfig.defaultLanguage] == null) {
            translations[multilingualConfig.defaultLanguage] = get(
                this.props.item,
                this.props.field,
                this.props.defaultValue
            );
        }

        return translations;
    }

    onChange(languageField: string, value: string) {
        const language = languageField.replace(this.props.field + '.', '');

        this.setState((prevState: Readonly<IState>) => ({
            fields: {
                ...prevState.fields,
                [language]: value,
            },
        }), () => {
            const translations = [...this.props.item?.translations ?? []];
            const fieldIndex = translations.findIndex((entry) => (
                entry.field === this.props.field &&
                entry.language === language
            ));

            if (fieldIndex >= 0) {
                translations[fieldIndex].value = value;
            } else {
                translations.push({
                    field: this.props.field,
                    language: language,
                    value: value,
                });
            }
            this.props.onChange('translations', translations);
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const multilingualConfig = planningApi.contentProfiles.multilingual.getConfig(this.props.profile?.name);
        const multilingualEnabled = (
            multilingualConfig.isEnabled === true &&
            multilingualConfig.fields.includes(this.props.field)
        );
        let languages = this.props.item.languages != null ?
            this.props.item.languages :
            multilingualConfig.languages;

        languages = this.props.showAllLanguages ? languages : languages.filter((lang: string) => (
            lang === this.props.language
        ));

        if (!multilingualEnabled) {
            // If multilingual is not enabled, then we show the input field as a normal text field
            // without translations
            return (
                <EditorFieldDynamicTextType
                    key={this.props.field}
                    {...this.props}
                />
            );
        } else if ((languages.length ?? 0) <= 1) {
            // If 1 or no language is selected, then we show the input field as a normal text field
            // without translations (but store it in the `translations` dictionary)
            const language = languages[0] ?? multilingualConfig.defaultLanguage;

            return (
                <EditorFieldDynamicTextType
                    {...this.props}
                    key={`${this.props.field}.${language}`}
                    testId={`${this.props.testId}.${language}`}
                    label={this.props.label}
                    field={`${this.props.field}.${language}`}
                    item={{[`${this.props.field}.${language}`]: this.state.fields[language] ?? ''}}
                    onChange={this.onChange}
                    language={language}
                />
            );
        }

        return (
            <React.Fragment>
                <ContentDivider type="dotted" />
                {languages.map((language, index) => (
                    <EditorFieldDynamicTextType
                        {...this.props}
                        key={`${this.props.field}.${language}`}
                        testId={`${this.props.testId}.${language}`}
                        label={gettext('{{ name }} ({{ language }})', {name: this.props.label, language: language})}
                        field={`${this.props.field}.${language}`}
                        item={{[`${this.props.field}.${language}`]: this.state.fields[language] ?? ''}}
                        onChange={this.onChange}
                        noPadding={index === language.length}
                        language={language}
                    />
                ))}
                <ContentDivider type="dotted" />
            </React.Fragment>
        );
    }
}

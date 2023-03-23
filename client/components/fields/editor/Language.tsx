import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {superdeskApi, planningApi} from '../../../superdeskApi';
import {IVocabularyItem} from 'superdesk-api';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldTreeSelect} from './base/treeSelect';
import {getLanguagesForTreeSelectInput} from '../../../selectors/vocabs';
import {Container, ButtonGroup, Button, Switch} from 'superdesk-ui-framework/react';

interface IProps extends IEditorFieldProps {
    languages: Array<{value: IVocabularyItem}>;
    clearable?: boolean;
    valueAsString?: boolean;
    setMainLanguage?(languageQcode?: IVocabularyItem['qcode']): void;
    showAllLanguages: boolean;
    toggleAllLanguages(): void;
}

const mapStateToProps = (state) => ({
    languages: getLanguagesForTreeSelectInput(state),
});

export class EditorFieldLanguageComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.state = {mainLanguage: undefined};

        this.onChange = this.onChange.bind(this);
    }

    onChange(field: string, value: Array<string>) {
        this.props.onChange(
            field,
            planningApi.contentProfiles.multilingual.isEnabled(this.props.profile) ?
                (value || []) :
                (value || null)
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {multilingual} = planningApi.contentProfiles;
        const {
            refNode,
            ...props
        } = this.props;

        const isMultilingual = multilingual.isEnabled(this.props.profile);
        const schemaLanguages = multilingual.getLanguages(this.props.profile);
        const languages = !isMultilingual ?
            this.props.languages :
            this.props.languages.filter((language) => (
                schemaLanguages.includes(language.value.qcode)
            ));
        const baseField = this.props.field ?? 'language';
        const field = !isMultilingual ? baseField : `${baseField}s`;

        const values = get(this.props.item, field, this.props.defaultValue || []);
        const showMainLanguageChoice = (
            isMultilingual === true &&
            values.length > 1 &&
            this.props.setMainLanguage != null
        );
        const selectedLanguages = this.props.languages
            .filter((entry) => values.includes(entry.value.qcode))
            .map((entry) => entry.value);

        const editor = (
            <EditorFieldTreeSelect
                ref={refNode}
                {...props}
                field={field}
                label={props.label ?? gettext('Language')}
                getOptions={() => languages}
                getId={(item: IVocabularyItem) => item.qcode}
                getLabel={(item: IVocabularyItem) => item.name}
                onChange={this.onChange}
                allowMultiple={isMultilingual}
                valueAsString={true}
                required={this.props.required ?? this.props.schema?.required}
                smallPadding={showMainLanguageChoice}
            />
        );

        return !showMainLanguageChoice ? editor : (
            <React.Fragment>
                {editor}
                <Container
                    id="editor--language-controls"
                    className={this.props.showAllLanguages ? undefined : 'sd-padding-b--3'}
                >
                    <ButtonGroup>
                        <Switch
                            label={{text: gettext('Show all language fields')}}
                            value={this.props.showAllLanguages}
                            onChange={() => this.props.toggleAllLanguages()}
                            disabled={this.props.disabled}
                        />
                    </ButtonGroup>
                    <ButtonGroup align="end" padded={true}>
                        <label style={{textTransform: 'uppercase'}}>{gettext('Main Language:')}</label>
                        {selectedLanguages.map((language) => (
                            <Button
                                key={language.qcode}
                                text={language.name}
                                data-test-id={`main-language--${language.qcode}`}
                                onClick={() => this.props.setMainLanguage(language.qcode)}
                                type={this.props.language === language.qcode ? 'primary' : 'default'}
                                style={this.props.language === language.qcode ? 'filled' : 'hollow'}
                            />
                        ))}
                    </ButtonGroup>
                </Container>
            </React.Fragment>
        );
    }
}

export const EditorFieldLanguage = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldLanguageComponent);

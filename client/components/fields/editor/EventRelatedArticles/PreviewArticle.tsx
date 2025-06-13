import React from 'react';

import {IArticle, IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../../../../superdeskApi';
import {appConfig} from 'appConfig';

import {ContentDivider, Heading} from 'superdesk-ui-framework/react';
import {fakeEditor} from './utils';

interface IProps {
    item: Partial<IArticle>;
}

interface IState {
    customFieldVocabularies: Array<IVocabulary>;
    loading: boolean;
}

export class PreviewArticle extends React.PureComponent<IProps, IState> {
    getLabel: (fieldId: string) => string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            customFieldVocabularies: [],
            loading: true,
        };

        this.getLabel = (fieldId: string) => fieldId;
    }

    componentDidMount(): void {
        const {getLabelNameResolver} = superdeskApi.entities.article;

        getLabelNameResolver().then((getLabel: (fieldId: string) => string) => {
            const allVocabulariesMap = superdeskApi.entities.vocabulary.getAll();
            const allVocabulariesArray = allVocabulariesMap.valueSeq().toArray();

            const customVocabularies = allVocabulariesArray;

            this.getLabel = getLabel;

            this.setState({
                customFieldVocabularies: customVocabularies,
                loading: false,
            });
        });
    }

    render() {
        const {gettext, formatDate} = superdeskApi.localization;
        const {PreviewFieldType} = superdeskApi.components.authoring;
        const {getSortedFields, getSortedFieldsFiltered} = superdeskApi.entities.article;

        const {allFields, extractedFields} = getSortedFieldsFiltered(
            'content',
            fakeEditor,
            this.props.item,
            false,
            this.state.customFieldVocabularies,
            ['body_html', 'headline']
        );
        const headlineField = extractedFields['headline'];
        const bodyField = extractedFields['body_html'];
        const subjects = this.props.item.subject || [];
        const groupedTags = subjects.reduce((acc, tag) => {
            const scheme = tag.scheme || 'unknown';

            if (!acc[scheme]) {
                acc[scheme] = [];
            }
            acc[scheme].push(tag);
            return acc;
        }, {} as {[scheme: string]: Array<any>});

        return (
            <div style={{width: '100%'}} className="preview-content">
                <div>
                    <div style={{flexGrow: 1}} className="css-table">
                        <div className="tr">
                            <div className="td sd-padding-b--0-5">
                                <span className="form-label">{gettext('Last modified')}</span>
                            </div>

                            <div className="td sd-padding-b--0-5 sd-padding-l--4">
                                {formatDate(new Date(this.props.item.versioncreated))}
                            </div>
                        </div>
                        {
                            getSortedFields(
                                'header',
                                fakeEditor,
                                this.props.item,
                                false,
                                this.state.customFieldVocabularies,
                            )
                                .map((field) => (
                                    <div key={field.id} className="tr">
                                        <div className="td sd-padding-b--0-5">
                                            <span className="form-label">{this.getLabel(field.id)}</span>
                                        </div>

                                        <div className="td sd-padding-b--0-5 sd-padding-l--4">
                                            <PreviewFieldType field={field} language={this.props.item.language} />
                                        </div>
                                    </div>
                                ))}

                        {Object.entries(groupedTags).map(([scheme, tags]) => {
                            const vocab = this.state.customFieldVocabularies.find((v) => v._id === scheme);

                            if (!vocab?.display_name) {
                                return null;
                            }

                            return (
                                <div key={scheme} className="tr">
                                    <div className="td sd-padding-b--0-5">
                                        <span className="form-label">{vocab.display_name}</span>
                                    </div>
                                    <div className="td sd-padding-b--0-5 sd-padding-l--4">
                                        <div className="subject-tags-container">
                                            {tags.map((item) => (
                                                <span
                                                    key={item.qcode}
                                                    className="small-tag"
                                                    style={{marginInlineEnd: '4px'}}
                                                >
                                                    {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <ContentDivider />
                    {
                        headlineField?.id && (
                            <Heading className="pb-2" type="h1">
                                {headlineField.value}
                            </Heading>
                        )
                    }
                    {
                        bodyField?.id && (
                            <div className="sd-margin-t--0-5" key={bodyField.id}>
                                <div
                                    className="sd-text sd-font-size--medium"
                                    dangerouslySetInnerHTML={{__html: bodyField.value as string}}
                                />
                            </div>
                        )
                    }
                    {allFields.map((field) => (
                        <div key={field.id}>
                            {appConfig?.authoring?.preview?.hideContentLabels === true ? <br /> : (
                                <Heading type="h3">
                                    {this.getLabel(field.id)}
                                </Heading>
                            )}
                            <div>
                                <PreviewFieldType field={field} language={this.props.item.language} />
                            </div>
                        </div>
                    ))}
                    <br />
                </div>
            </div>
        );
    }
}

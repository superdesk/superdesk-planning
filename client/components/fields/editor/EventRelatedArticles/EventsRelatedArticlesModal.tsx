import React from 'react';
import {
    SearchBar,
    Modal,
    Dropdown,
    Spacer,
    Button,
    WithPagination,
    Loader,
    Panel,
    PanelHeader,
    PanelContent,
    PanelContentBlock,
    ContentDivider,
    LayoutContainer,
    HeaderPanel,
    MainPanel,
    RightPanel,
} from 'superdesk-ui-framework/react';
import {getProjectedFieldsArticle, gettext} from 'superdesk-core/scripts/core/utils';
import {httpRequestJsonLocal} from 'superdesk-core/scripts/core/helpers/network';
import {toElasticQuery} from 'superdesk-core/scripts/core/query-formatting';
import {IArticle, IRestApiResponse, ISuperdeskQuery} from 'superdesk-api';
import {cleanArticlesFields} from './utils';
import {RelatedArticlesListComponent} from './RelatedArticlesListComponent';
import '../../../../components/Archive/ArchivePreview/style.scss';
import {PreviewArticle} from './PreviewArticle';

interface IProps {
    closeModal: () => void;
    selectedArticles?: Array<Partial<IArticle>>;
    onChange: (value: Array<Partial<IArticle>>) => void;
}

interface IState {
    articles: Array<Partial<IArticle>>;
    searchQuery: string;
    loading: boolean;
    currentlySelectedArticles?: Array<Partial<IArticle>>;
    activeLanguage: {code: string; label: string;};
    previewItem: Partial<IArticle> | null;
    repo: string | null;
}


export class EventsRelatedArticlesModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            articles: [],
            searchQuery: '',
            loading: true,
            currentlySelectedArticles: this.props.selectedArticles,
            activeLanguage: {label: 'All languages', code: ''},
            previewItem: null,
            repo: null,
        };
    }

    componentDidMount() {
        httpRequestJsonLocal<IRestApiResponse<any>>({
            method: 'GET',
            path: '/search_providers',
            urlParams: {
                manage: 1,
            }
        }).then((result) => {
            const repoId = result._items.find((provider) =>
                provider.source === 'http://wss-01.staging.belga.be:9000/archivenewsobjects')._id;

            this.setState({
                repo: repoId,
            });
        });
    }

    componentDidUpdate(_prevProps: Readonly<IProps>, prevState: Readonly<IState>): void {
        if (prevState.activeLanguage.code !== this.state.activeLanguage.code
            || prevState.searchQuery !== this.state.searchQuery
            || prevState.repo !== this.state.repo
        ) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                loading: true,
            });
        }
    }

    render(): React.ReactNode {
        const {closeModal} = this.props;
        const allLanguages = [
            {
                label: 'English',
                code: 'en'
            },
            {
                label: 'Dutch',
                code: 'nl'
            },
            {
                label: 'French',
                code: 'fr'
            },
            {
                label: 'All languages',
                code: ''
            }
        ];
        const onSelectLanguage = (lang: typeof allLanguages[0]) => {
            this.setState({
                activeLanguage: lang
            });
        };

        return (
            <Modal
                headerTemplate={gettext('Search Related Articles')}
                visible
                contentPadding="none"
                contentBg="medium"
                size="x-large"
                onHide={closeModal}
                footerTemplate={(
                    <Spacer h gap="8" noWrap alignItems="end" justifyContent="end">
                        <Button
                            onClick={() => {
                                closeModal();
                            }}
                            text={gettext('Cancel')}
                            style="filled"
                        />
                        <Button
                            onClick={() => {
                                this.props.onChange(cleanArticlesFields(this.state.currentlySelectedArticles ?? []));
                                closeModal();
                            }}
                            disabled={JSON.stringify(this.props.selectedArticles)
                                === JSON.stringify(this.state.currentlySelectedArticles)}
                            text={gettext('Apply')}
                            style="filled"
                            type="primary"
                        />
                    </Spacer>
                )}
            >
                <LayoutContainer>
                    <HeaderPanel>
                        <div className="sd-padding-all--2 sd-panel-bg--000">
                            <SearchBar
                                value={this.state.searchQuery}
                                onSubmit={(value: string) => {
                                    this.setState({
                                        searchQuery: value,
                                    });
                                }}
                                placeholder={gettext('Search...')}
                                boxed
                            >
                                <Dropdown
                                    maxHeight={300}
                                    append
                                    zIndex={2001}
                                    items={[
                                        {
                                            type: 'group',
                                            items: allLanguages.map((language) => ({
                                                label: language.label,
                                                onSelect: () => onSelectLanguage(language)
                                            }))
                                        },
                                    ]}
                                >
                                    {this.state.activeLanguage.label}
                                </Dropdown>
                            </SearchBar>
                        </div>
                    </HeaderPanel>
                    <ContentDivider margin="none" />
                    <MainPanel>
                        <WithPagination
                            key={this.state.activeLanguage.code + this.state.searchQuery + this.state.repo}
                            pageSize={20}
                            getItems={(pageNo, pageSize, signal) => {
                                const query: Partial<ISuperdeskQuery> = {
                                    page: pageNo,
                                    max_results: pageSize,
                                    sort: [{versioncreated: 'desc'}],
                                };

                                if (this.state.activeLanguage.code !== '') {
                                    query.filter = {$and: [{language: {$eq: this.state.activeLanguage.code}}]};
                                }

                                if (this.state.searchQuery !== '') {
                                    query.fullTextSearch = this.state.searchQuery.toLowerCase();
                                }

                                if (this.state.repo == null) {
                                    return Promise.resolve({items: [], itemCount: 0});
                                }

                                return httpRequestJsonLocal<IRestApiResponse<Partial<IArticle>>>({
                                    method: 'GET',
                                    path: '/search_providers_proxy',
                                    urlParams: {
                                        aggregations: 0,
                                        es_highlight: 1,
                                        repo: this.state.repo,
                                        projections: JSON.stringify(getProjectedFieldsArticle()),
                                        ...toElasticQuery(query as ISuperdeskQuery),
                                    },
                                    abortSignal: signal,
                                })
                                    .then((res) => {
                                        this.setState({
                                            loading: false,
                                        });

                                        return {items: res._items, itemCount: res._meta.total};
                                    });
                            }}
                        >
                            {
                                (items: Array<Partial<IArticle>>) => (
                                    <div className="sd-padding-y--1-5">
                                        <Spacer
                                            v
                                            gap="4"
                                            justifyContent="center"
                                            alignItems="center"
                                            noWrap
                                        >
                                            {items.map((articleFromArchive) => (
                                                <RelatedArticlesListComponent
                                                    key={articleFromArchive.guid}
                                                    article={articleFromArchive}
                                                    setPreview={(itemToPreview) => {
                                                        this.setState({
                                                            previewItem: itemToPreview,
                                                        });
                                                    }}
                                                    removeArticle={(articleId: string) => {
                                                        const filteredArray =
                                                [...(this.state.currentlySelectedArticles ?? [])]
                                                    .filter(({guid}) => guid !== articleId);

                                                        this.setState({
                                                            currentlySelectedArticles: filteredArray
                                                        });
                                                    }}
                                                    prevSelected={(this.props.selectedArticles ?? [])
                                                        .find((x) => x.guid === articleFromArchive.guid) != null
                                                    }
                                                    addArticle={(article: Partial<IArticle>) => {
                                                        this.setState({
                                                            currentlySelectedArticles: [
                                                                ...(this.state.currentlySelectedArticles ?? []),
                                                                article,
                                                            ]
                                                        });
                                                    }}
                                                    openInPreview={
                                                this.state.previewItem?.guid === articleFromArchive.guid
                                                    }
                                                />
                                            ))}
                                        </Spacer>
                                    </div>
                                )
                            }
                        </WithPagination>
                        {this.state.loading && (
                            <div
                                style={{
                                    justifySelf: 'center',
                                    alignSelf: 'center',
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                <Loader overlay />
                            </div>
                        )}
                    </MainPanel>
                    <RightPanel open={this.state.previewItem != null}>
                        <Panel
                            open={this.state.previewItem != null}
                            side="right"
                            size="medium"
                            className="sd-panel-bg--000"
                        >
                            <PanelHeader
                                title={gettext('Article preview')}
                                onClose={() => {
                                    this.setState({
                                        previewItem: null,
                                    });
                                }}
                            />
                            <PanelContent empty={this.state.previewItem == null} >
                                <PanelContentBlock>
                                    {this.state.previewItem && (<PreviewArticle item={this.state.previewItem} />)}
                                </PanelContentBlock>
                            </PanelContent>
                        </Panel>
                    </RightPanel>
                </LayoutContainer>
            </Modal>
        );
    }
}

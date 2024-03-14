import React from 'react';
import {SearchBar, Modal, Dropdown, Loader, Spacer} from 'superdesk-ui-framework/react';
import {RelatedArticleComponent} from './RelatedArticleComponent';
import {gettext} from 'superdesk-core/scripts/core/utils';

interface IProps {
    closeModal: () => void;

    // if there were any articles that were already selected, this is the array for them,
    // is used to determine the data inside the modal and the article
    selectedArticles: Array<string>;
}

interface IState {
    articles: Array<IBelgaArchiveNewsObject>;
    searchQuery: string;
    loading: boolean;
}

export interface IBelgaArchiveNewsObject {
    newsObjectId: string;
    newsItemId: number;
    assetType: string;
    name: string;
    credit: string;
    topic?: any;
    headLine: string;
    language: string;
    source: string;
    city: string;
    country: string;
    createDate: number; // ISO
    validateDate: number; // ISO
    editorialInfo?: any;
    comments: string;
    authors: Array<{name: string; type: string}>;
    keywords: Array<string>;
    packages: Array<{newsProduct: string; newsService: string;}>;
    newsComponents: Array<{
        newsComponentId: number;
        name: string;
        assetType: string;
        assetFormat: string;
        componentClass: string;
        width?: number;
        height?: number;
        alternateComponents: Array<any>;
        proxies: Array<{
            proxyId: number;
            assetFormat: string;
            dataFileName: string;
            dataDirName: string;
            physicalDataDirName: string;
            ingestPath: string;
            varcharData: string;
            clobData: string;
            status: string;
            protocol: string;
            size: number;
            urn?: string;
        }>;
    }>;
}

interface IBelgaArchiveResult {
    newsObjects: Array<IBelgaArchiveNewsObject>;
    nrNewsObjects: number;
    start: number;
}

export default class EventsRelatedArticlesModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            articles: [],
            searchQuery: '',
            loading: true,
        };
    }

    fetchArticles() {
        return fetch(
            'http://wss-01.staging.belga.be:9000/archivenewsobjects',
            {
                method: 'GET'
            },
        )
            .then((result) => result.json())
            .then((parsedResult: IBelgaArchiveResult) => {
                this.setState({
                    articles: parsedResult.newsObjects,
                    loading: false,
                });
            });
    }

    componentDidMount(): void {
        this.fetchArticles();
    }

    render(): React.ReactNode {
        const {closeModal} = this.props;

        return (
            <Modal
                headerTemplate={gettext('Search Related Articles')}
                visible
                contentPadding="medium"
                contentBg="medium"
                size="medium"
                onHide={closeModal}
            >
                <Spacer v gap="16">
                    <SearchBar
                        value={this.state.searchQuery}
                        onSubmit={(value: string) => {
                            this.setState({
                                searchQuery: value,
                            });
                        }}
                        placeholder={gettext('Search articles')}
                        boxed
                    >
                        <Dropdown
                            maxHeight={300}
                            append
                            zIndex={2001}
                            items={[]}
                        >
                            {gettext('All searches')}
                        </Dropdown>
                    </SearchBar>
                    <ul className="compact-view list-view">
                        {this.state.loading ? (
                            <div><Loader /></div>
                        ) : (
                            this.state.articles
                                .filter((x) => x.headLine.toLowerCase().includes(this.state.searchQuery ?? ''))
                                .map((articleFromArchive) => (
                                    <RelatedArticleComponent
                                        prevSelected={(this.props.selectedArticles ?? [])
                                            .includes(articleFromArchive.newsObjectId)}
                                        key={articleFromArchive.newsObjectId}
                                        article={articleFromArchive}
                                    />
                                ))
                        )}
                    </ul>
                </Spacer>
            </Modal>
        );
    }
}

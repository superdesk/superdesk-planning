import React from 'react';
import {SearchBar, Modal, Dropdown} from 'superdesk-ui-framework/react';
// import {superdeskApi} from '../../superdeskApi';
import {ISuperdesk} from 'superdesk-api';
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
        };
    }

    fetchArticles() {
        return fetch(
            'http://wss-01.staging.belga.be:9000/archivenewsobjects',
            {
                method: 'GET'
            },
        ).then((result: IBelgaArchiveResult) => {
            this.setState({
                articles: result.newsObjects,
            });
        });
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
                    {this.state.articles.map((articleFromArchive) => (
                        <RelatedArticleComponent
                            selected={this.props.selectedArticles.includes(articleFromArchive.newsObjectId)}
                            key={articleFromArchive.newsObjectId}
                            article={articleFromArchive}
                        />
                    ))}
                </ul>
            </Modal>
        );
    }
}

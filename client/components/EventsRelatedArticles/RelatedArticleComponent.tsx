import React, {useState} from 'react';
import {IBelgaArchiveNewsObject} from './EventsRelatedArticlesModal';

interface IProps {
    article: IBelgaArchiveNewsObject;
    selected?: boolean;
}

export const RelatedArticleComponent = ({article, selected}: IProps) => {
    const [hovered, setHovered] = useState(selected ?? false);

    return (
        <li
            className="list-item-view actions-visible"
            draggable
            tabIndex={0}
            data-test-id="article-item"
        >
            <div className="media-box media-text">
                <div>
                    <span className="state-border" />
                    <div
                        onMouseOver={() => {
                            setHovered(!hovered);
                        }}
                        className="list-field type-icon sd-monitoring-item-multi-select-checkbox"
                        data-test-id="item-type-and-multi-select"
                        style={{lineHeight: 0}}
                    >
                        <span className="a11y-only">Article Type: {article.assetType}</span>
                        {
                            hovered ? (
                                <button
                                    role="checkbox"
                                    aria-checked="true"
                                    aria-label="bulk actions"
                                    data-test-id="multi-select-checkbox"
                                >
                                    <span className="sd-checkbox checked" />
                                </button>
                            ) : (
                                <i
                                    className="filetype-icon-text"
                                    title="Article Type: text"
                                    aria-label="Article Type text"
                                    aria-hidden="true"
                                />
                            )
                        }
                    </div>
                    <div className="list-field urgency">
                        <span
                            className="badge urgency-label--3"
                            title="Urgency: 3"
                            style={{backgroundColor: 'rgb(128, 128, 128)'}}
                        >
                            {/* {article.} 3 */}
                        </span>
                    </div>
                    <div
                        className="item-info"
                        style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                    >
                        <div
                            style={{flexGrow: 1, flexDirection: 'column', overflow: 'hidden'}}
                        >
                            <div className="line">
                                <span className="item-heading">{article.headLine}</span>
                                <div className="highlights-box" />
                                <div className="highlights-box" />
                                <time title="February 15, 2024 10:13 AM">{article.createDate}</time>
                            </div>
                            <div className="line">
                                <span title="In Progress" className="state-label state-in_progress">{article.language}</span> // state
                                {/* <span className="provider">Belga</span> */}
                                <span className="container" title="desk: Dutch">
                                    <span className="location-desk-label">desk:</span>
                                    Dutch {article.country}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

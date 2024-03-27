import React from 'react';
import {ReactNode} from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'superdesk-core/scripts/core/utils';
import {ContentListItem, IconButton, Label, Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    article: Partial<IArticle>;
    prevSelected?: boolean;
    addArticle?: (article: Partial<IArticle>) => void;
    removeArticle: (id: string) => void;
    setPreview?: (itemToPreview: Partial<IArticle>) => void;

    // True if this component is rendered inside the editor field view
    editorPreview?: boolean;

    // True if the current article passed from props is in preview
    openInPreview?: boolean;
}

interface IState {
    hovered: boolean;
    selected: boolean;
}

export class RelatedArticlesListComponent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            hovered: false,
            selected: this.props.prevSelected ?? false,
        };
    }

    render(): ReactNode {
        const {
            article,
            editorPreview,
            removeArticle,
            setPreview,
            addArticle
        } = this.props;
        const {selected, hovered} = this.state;

        return (
            <div
                style={{
                    width: '100%'
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setPreview?.(article);
                }}
                onMouseLeave={(e) => {
                    this.setState({
                        hovered: false,
                    });

                    e.stopPropagation();
                    e.preventDefault();
                }}
                onMouseOver={(e) => {
                    this.setState({
                        hovered: true,
                    });

                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <ContentListItem
                    locked={false}
                    itemColum={[
                        {
                            itemRow: [{
                                content: (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();

                                            if (!editorPreview) {
                                                this.setState({
                                                    selected: !this.state.selected
                                                });
                                                selected
                                                    ? removeArticle(article.guid as string)
                                                    : addArticle?.(article);
                                            }
                                        }}
                                    >
                                        <span
                                            className="a11y-only"
                                        >
                                            {gettext('Article Type: {{articleType}}', {articleType: article.type})}
                                        </span>
                                        {
                                            editorPreview && (
                                                <IconButton
                                                    ariaValue={gettext('Article Type: text')}
                                                    icon="text"
                                                    onClick={() => {
                                                        //
                                                    }}
                                                />
                                            )
                                        }
                                        {
                                            !editorPreview && ((hovered && !selected) || selected ? (
                                                <div className="icn-btn">
                                                    <span
                                                        className={`sd-checkbox ${selected ? 'checked' : 'unchecked'}`}
                                                    />
                                                </div>
                                            ) : (
                                                <IconButton
                                                    ariaValue={gettext('Article Type: text')}
                                                    icon="text"
                                                    onClick={() => {
                                                        //
                                                    }}
                                                />
                                            ))
                                        }
                                    </div>
                                ),
                            }],
                            border: true,
                        },
                        {
                            itemRow: [
                                {
                                    content: (
                                        <div
                                            style={{
                                                fontSize: 14,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <span>
                                                {article.headline}
                                            </span>
                                        </div>
                                    ),
                                },
                                {
                                    content: (
                                        <Spacer
                                            h
                                            gap="4"
                                            justifyContent="start"
                                            noWrap
                                        >
                                            <Label
                                                text={article.language}
                                                style="filled"
                                                size="small"
                                                type="primary"
                                            />
                                            <Label
                                                text={article.type as string}
                                                style="translucent"
                                                size="small"
                                                type="default"
                                            />
                                            <Label
                                                text={article.state as string}
                                                style="filled"
                                                size="small"
                                                type="sd-green"
                                            />
                                        </Spacer>
                                    ),
                                },
                            ],
                            fullwidth: true,
                        },
                        {
                            itemRow: [{
                                content: (
                                    <span>{new Date(article.versioncreated).toDateString()}</span>
                                ),
                            }],
                        }
                    ]}
                    loading={false}
                    activated={false}
                    action={this.props.editorPreview && (
                        <IconButton
                            ariaValue={gettext('Remove')}
                            icon="trash"
                            onClick={() => {
                                removeArticle(article.guid as string);
                            }}
                        />
                    )}
                    selected={this.props.openInPreview}
                    archived={false}
                    onClick={() => {
                        this.props.setPreview?.(this.props.article);
                    }}
                />
            </div>
        );
    }
}

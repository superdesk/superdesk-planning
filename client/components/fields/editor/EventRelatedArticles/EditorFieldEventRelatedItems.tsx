import * as React from 'react';
import {ButtonGroup, Button, Spacer} from 'superdesk-ui-framework/react';
import '../EventRelatedPlannings/style.scss';
import {showModal} from '@superdesk/common';
import {EventsRelatedArticlesModal} from './EventsRelatedArticlesModal';
import {IArticle} from 'superdesk-api';
import {cleanArticlesFields} from './utils';
import {RelatedArticlesListComponent} from './RelatedArticlesListComponent';
import {IEditorFieldProps, IEventItem, IProfileSchemaTypeList} from 'interfaces';
import {Row} from 'superdesk-core/scripts/core/ui/components/List';
import {gettext} from 'superdesk-core/scripts/core/utils';

interface IProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;
}

interface IState {
    selectedRelatedArticles: Array<Partial<IArticle>>;
}

export class EditorFieldEventRelatedItems extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedRelatedArticles: this.props.item.related_items as Array<Partial<IArticle>>,
        };
    }

    componentDidUpdate(prevProps: Readonly<IProps>): void {
        const relatedItemsUpdated = this.props.item.related_items as Array<Partial<IArticle>>;

        if (JSON.stringify(relatedItemsUpdated) !== JSON.stringify(prevProps.item.related_items)) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                selectedRelatedArticles: relatedItemsUpdated,
            });
        }
    }

    render() {
        const disabled = this.props.disabled || this.props.schema?.read_only;

        return (
            <div className="related-plannings">
                <Row flex={true} noPadding={true}>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Articles')}
                    </label>
                    {disabled ? null : (
                        <ButtonGroup align="end">
                            <Button
                                type="primary"
                                icon="plus-large"
                                text="plus-large"
                                shape="round"
                                size="small"
                                iconOnly={true}
                                onClick={() =>
                                    showModal(({closeModal}) => (
                                        <EventsRelatedArticlesModal
                                            onChange={(value) => {
                                                this.props.onChange(this.props.field, cleanArticlesFields(value));
                                            }}
                                            selectedArticles={this.state.selectedRelatedArticles}
                                            closeModal={() => {
                                                closeModal();
                                            }}
                                        />
                                    ))
                                }
                            />
                        </ButtonGroup>
                    )}
                </Row>
                {(this.props.item.related_items?.length ?? 0) < 1 ? (
                    <Row>
                        <div style={{width: '100%'}} className="info-box--dashed">
                            <label>{gettext('No related articles yet')}</label>
                        </div>
                    </Row>
                ) : (
                    <Spacer v gap="4" justifyContent="center" alignItems="center" noWrap>
                        {
                            (this.state.selectedRelatedArticles ?? []).map((relItem) => (
                                <RelatedArticlesListComponent
                                    key={relItem.guid}
                                    editorPreview
                                    removeArticle={(articleId) => {
                                        this.props.onChange(
                                            this.props.field,
                                            cleanArticlesFields(
                                                [...(this.state.selectedRelatedArticles ?? [])]
                                                    .filter(({guid}) => guid !== articleId)
                                            )
                                        );
                                    }}
                                    article={relItem}
                                />
                            ))
                        }
                    </Spacer>
                )}
            </div>
        );
    }
}

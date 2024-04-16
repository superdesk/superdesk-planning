import * as React from 'react';

import {IArticle} from 'superdesk-api';
import {IListFieldProps, IEventItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import {ContentBlock} from '../../UI/SidePanel';

interface IProps extends IListFieldProps {
    item: IEventItem;
    languageFilter?: string;
}

export function PreviewFieldRelatedArticles({item, languageFilter}: IProps) {
    const {ArticleItemConcise} = superdeskApi.components;
    const {gettext} = superdeskApi.localization;
    const relatedItems = (languageFilter?.length ?? 0) === 0 ?
        item.related_items ?? [] :
        (item.related_items ?? []).filter((relatedItem) => relatedItem.language === languageFilter);

    return (
        <ContentBlock className="sd-padding--0 sd-padding-b--2">
            <h3 className="side-panel__heading side-panel__heading--big">
                {gettext('Related Articles')}
            </h3>
            {relatedItems.length === 0 ? (
                <span className="sd-text__info">
                    {gettext('No related articles')}
                </span>
            ) : (
                relatedItems.map((relatedItem) => (
                    <ArticleItemConcise
                        key={relatedItem.guid}
                        article={relatedItem as any as IArticle}
                    />
                ))
            )}
        </ContentBlock>
    );
}

import React from 'react';
import {ContentDivider, SimpleList, SimpleListItem} from 'superdesk-ui-framework/react';

import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

interface IProps {
    item: IArticle;
}

export function ArchivePreviewMetadataList({item}: IProps) {
    const {gettext} = superdeskApi.localization;

    const desk = superdeskApi.entities.desk.getDeskById(item.task.desk);
    const stage = superdeskApi.entities.desk.getStageById(item.task.stage);
    const wordCountLabel = gettext(
        '{{ wordCount }} words',
        {wordCount: item.word_count ?? 0},
    );

    return desk == null ? null : (
        <SimpleList border={true} density="comfortable">
            <SimpleListItem>
                <span className="text-color-muted">{gettext('Desk:')}</span>
                <span className="font-bold">{desk.name}</span>
                <span className="text-color-muted">/ {stage.name}</span>
                <ContentDivider orientation="vertical" margin="x-small" />
                <span className="text-color-muted">{wordCountLabel}</span>
            </SimpleListItem>
            {(item.ednote?.length ?? 0) === 0 ? null : (
                <SimpleListItem>
                    <span className="text-color-muted">
                        {gettext('Editorial Note:')}
                    </span>
                    <span className="text-red--800">
                        {item.ednote}
                    </span>
                </SimpleListItem>
            )}
        </SimpleList>
    );
}

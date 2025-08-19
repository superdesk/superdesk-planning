import React from 'react';
import {connect} from 'react-redux';

import {
    ToggleBox,
    SimpleList,
    SimpleListItem,
    ContentDivider,
    Heading,
    PanelContentBlock,
} from 'superdesk-ui-framework/react';

import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IAssignmentItem} from '../../../interfaces';
import * as selectors from '../../../selectors';

import {HtmlPreview, ItemRendition} from '../../';
import {ArchiveItem} from '../ArchiveItem';
import {AuditInformation} from '../../';
import {getCreator} from '../../../utils';


interface IProps {
    assignment: IAssignmentItem;
    archiveItems: {[itemId: string]: IArticle};
    selectedArchiveItemId: IArticle['_id'];
}

class ArchivePreviewComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {UserAvatar} = superdeskApi.components;
        const users = Object.values(superdeskApi.entities.users.getAllUsers());

        const relatedItems = this.props.assignment.linked_items
            .map((itemLink) => (this.props.archiveItems[itemLink._id]))
            .filter((item) => (item != null));

        return relatedItems.map((archive) => (
            <PanelContentBlock key={archive._id} className="ArchivePreview content-item-preview">
                <ToggleBox
                    key={archive._id + '-' + (this.props.selectedArchiveItemId == archive._id).toString()}
                    variant="custom-header"
                    header={(<ArchiveItem item={archive} use2Lines={true} />)}
                    initiallyOpen={relatedItems.length === 1 || this.props.selectedArchiveItemId === archive._id}
                    getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                >
                    {(() => {
                        const createdBy = getCreator(archive, 'original_creator', users);
                        const updatedBy = getCreator(archive, 'version_creator', users);
                        const creationDate = archive._created;
                        const updatedDate = archive._updated;
                        const versionCreator = updatedBy?.display_name ?
                            updatedBy :
                            users.find((user) => user._id === updatedBy);

                        return (
                            <div className="flex-row p-1 gap-1">
                                <UserAvatar userId={archive.version_creator} />
                                <AuditInformation
                                    createdBy={createdBy}
                                    updatedBy={versionCreator}
                                    createdAt={creationDate}
                                    updatedAt={updatedDate}
                                    showStateInformation
                                    item={archive}
                                />
                            </div>
                        );
                    })()}
                    <SimpleList border={true} density="comfortable">
                        {(() => {
                            const desk = superdeskApi.entities.desk.getDeskById(archive.task.desk);
                            const stage = superdeskApi.entities.desk.getStageById(archive.task.stage);
                            const wordCountLabel = gettext(
                                '{{ wordCount }} words',
                                {wordCount: archive.word_count ?? 0},
                            );

                            return desk == null ? null : (
                                <SimpleListItem>
                                    <span className="text-color-muted">{gettext('Desk:')}</span>
                                    <span className="font-bold">{desk.name}</span>
                                    <span className="text-color-muted">/ {stage.name}</span>
                                    <ContentDivider orientation="vertical" margin="x-small" />
                                    <span className="text-color-muted">{wordCountLabel}</span>
                                </SimpleListItem>
                            );
                        })()}
                        {(archive.ednote?.length ?? 0) === 0 ? null : (
                            <SimpleListItem>
                                <span className="text-color-muted">{gettext('Editorial Note:')}</span>
                                <span className="text-red--800">
                                    {archive.ednote}
                                </span>
                            </SimpleListItem>
                        )}
                    </SimpleList>
                    {(archive.type === 'composite' || (archive.headline?.length ?? 0) === 0) ? null : (
                        <Heading type="h2">
                            {archive.headline}
                        </Heading>
                    )}

                    <div className="content">
                        <div className="core-content">
                            {archive.associations?.featuremedia == null ? null : (
                                <div>
                                    <ItemRendition item={archive.associations.featuremedia} />
                                    <p>{archive.associations.featuremedia.description_text}</p>
                                </div>
                            )}

                            {!(archive.type === 'picture' || archive.type === 'graphic') ? null : (
                                <div>
                                    <span>{gettext('Original')}</span>
                                    <ItemRendition item={archive} />
                                </div>
                            )}

                            {archive.type !== 'audio' ? null : (
                                <div>
                                    <audio controls>
                                        <source
                                            src={archive.renditions?.original?.href}
                                            type={archive.renditions?.original?.mimetype}
                                        />
                                    </audio>
                                </div>
                            )}

                            {archive.type !== 'video' ? null : (
                                <div>
                                    <video controls>
                                        <source
                                            src={archive.renditions?.original?.href}
                                            type={archive.renditions?.original?.mimetype}
                                        />
                                    </video>
                                </div>
                            )}

                            {(archive.abstract?.length ?? 0) == 0 ? null : (
                                <HtmlPreview className="text abstract" html={archive.abstract} />
                            )}
                            {(archive.byline?.length ?? 0) == 0 ? null : (
                                <HtmlPreview className="text byline" html={archive.byline} />
                            )}
                            {(archive.dateline?.text?.length ?? 0) == 0 ? null : (
                                <HtmlPreview className="text dateline" html={archive.dateline.text} />
                            )}
                            {(archive.body_html?.length ?? 0) == 0 ? null : (
                                <HtmlPreview className="text body-text html-preview" html={archive.body_html} />
                            )}
                            {(archive.body_footer?.length ?? 0) == 0 ? null : (
                                <HtmlPreview className="text body-footer" html={archive.body_footer} />
                            )}
                            {(archive.sign_off?.length ?? 0) == 0 ? null : (
                                <HtmlPreview className="text sign-off" html={archive.sign_off} />
                            )}
                        </div>
                    </div>

                </ToggleBox>
            </PanelContentBlock>
        ));
    }
}

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    archiveItems: selectors.getStoredArchiveItems(state),
    selectedArchiveItemId: selectors.getSelectedArchiveItemId(state),
});

export const ArchivePreview = connect(mapStateToProps)(ArchivePreviewComponent);

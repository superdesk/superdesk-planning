import React from 'react';
import {connect} from 'react-redux';

import {ToggleBox, Heading, PanelContentBlock} from 'superdesk-ui-framework/react';

import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IAssignmentItem} from '../../../interfaces';
import * as selectors from '../../../selectors';

import {HtmlPreview, ItemRendition} from '../../';
import {ArchiveItem} from '../ArchiveItem';
import {ArchivePreviewAuditInformationComponent} from './ArchivePreviewAuditInformation';
import {ArchivePreviewMetadataList} from './ArchivePreviewMetadataList';


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
            <PanelContentBlock
                key={archive._id + '-' + (this.props.selectedArchiveItemId == archive._id)}
                className="ArchivePreview content-item-preview"
            >
                <ToggleBox
                    variant="custom-header"
                    header={(<ArchiveItem item={archive} use2Lines={true} />)}
                    initiallyOpen={relatedItems.length === 1 || this.props.selectedArchiveItemId === archive._id}
                    getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                >
                    <ArchivePreviewAuditInformationComponent item={archive} />
                    <ArchivePreviewMetadataList item={archive} />
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

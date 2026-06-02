import React from 'react';
import {connect} from 'react-redux';
import moment from 'moment';

import {ContentListItem, IconButton, Label} from 'superdesk-ui-framework/react';

import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {Row} from '../UI/List';
import {ItemIcon} from '../';
import {UrgencyLabel} from '../';
import * as selectors from '../../selectors';

interface IProps {
    item: IArticle;
    urgencies: any;
    urgencyLabel: any;
    use2Lines?: boolean;
    hideOpenCoverageAction?: boolean;
    onClick?(): void;
    onDoubleClick?(): void;
}

export function ArchiveItemComponent({
    item,
    urgencies,
    urgencyLabel,
    use2Lines,
    hideOpenCoverageAction,
    onClick,
    onDoubleClick,
}: IProps) {
    const {gettext} = superdeskApi.localization;
    const stateProps: Label['props'] = ['PUBLISHED', 'SCHEDULED', 'CORRECTED'].includes(item.state) ? {
        type: 'success',
        style: 'translucent',
        text: gettext('Completed'),
    } : {
        type: 'warning',
        style: 'translucent',
        text: gettext('In Progress'),
    };

    return (
        <ContentListItem
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            locked={item.lock_action != null}
            action={hideOpenCoverageAction === true ? null : (
                <IconButton
                    icon="external"
                    ariaValue={gettext('Open Coverage')}
                    onClick={() => {
                        superdeskApi.ui.article.edit(item._id);
                    }}
                />
            )}
            itemColum={[
                {
                    itemRow: [{content: (<ItemIcon item={item} />)}],
                    border: true,
                },
                {
                    border: true,
                    itemRow: [{content: (
                        <Row>
                            <UrgencyLabel
                                item={item}
                                label={urgencyLabel}
                                urgencies={urgencies}
                                tooltipFlow="down"
                                inline={true}
                            />
                        </Row>
                    )}],
                },
                {
                    fullwidth: true,
                    itemRow: use2Lines !== true ? [{content: (
                        <Row>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__slugline">{item.slugline}</span>
                                <Label {...stateProps} />
                                {item.headline}
                                <div className="sd-list-item__element-lm-10">
                                    <span className="sd-list-item__text-label pe-0-5">
                                        {gettext('Genre:')}
                                    </span>
                                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                                        <span>{item.genre?.[0]?.name}</span>
                                    </span>
                                </div>
                            </span>
                            <time className="sd-margin-s--auto">{moment(item.versioncreated).fromNow()}</time>
                        </Row>
                    )}] : [
                        {content: (
                            <React.Fragment>
                                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                    <span className="sd-list-item__slugline">{item.slugline}</span>
                                    {item.headline}
                                </span>
                                <time className="sd-margin-s--auto">{moment(item.versioncreated).fromNow()}</time>
                            </React.Fragment>
                        )},
                        {content: (
                            <React.Fragment>
                                <Label {...stateProps} />
                                <div className="sd-list-item__element-lm-10">
                                    <span className="sd-list-item__text-label pe-0-5">
                                        {gettext('Genre:')}
                                    </span>
                                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                                        <span>{item.genre?.[0]?.name}</span>
                                    </span>
                                </div>
                            </React.Fragment>
                        )}
                    ]
                }
            ]}
        />
    );
}

const mapStateToProps = (state) => ({
    urgencies: selectors.getUrgencies(state),
    urgencyLabel: selectors.vocabs.urgencyLabel(state),
});

export const ArchiveItem = connect(mapStateToProps)(ArchiveItemComponent);

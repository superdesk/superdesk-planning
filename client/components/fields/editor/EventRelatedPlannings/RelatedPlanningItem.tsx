import * as React from 'react';

import {
    EDITOR_TYPE,
    IEventItem,
    IPlanningContentProfile,
    IPlanningItem,
    ISearchProfile
} from '../../../../interfaces';
import {planningApi, superdeskApi} from '../../../../superdeskApi';

import {IconButton, ToggleBox} from 'superdesk-ui-framework/react';
import {RelatedPlanningListItem} from '../../../RelatedPlannings/PlanningMetaData/RelatedPlanningListItem';
import {PlanningEditorStandalone} from '../../../editor-standalone/planning-editor-standalone';
import {authoringStoragePlanningItemHttp} from '../../../editor-standalone/authoring-storage-planning-http';
import {getAuthoringStorageInMemory} from '../../../editor-standalone/authoring-storage-in-memory';
import {IAuthoringReact} from 'superdesk-api';
import {CustomHeaderToggleBox} from 'superdesk-ui-framework/react/components/ToggleBox/CustomHeaderToggleBox';
import {isTemporaryId, modifyForServer} from '../../../../utils';
import {omit} from 'lodash';

interface IProps {
    event: IEventItem;
    item: DeepPartial<IPlanningItem>;
    index: number;
    disabled: boolean;
    editorType: EDITOR_TYPE;
    profile: IPlanningContentProfile;
    coverageProfile?: ISearchProfile;
    unlinkPlanning(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(
        original: DeepPartial<IPlanningItem>,
        updates: DeepPartial<IPlanningItem>,
        scrollOnChange: boolean
    ): void;
    isAgendaEnabled: boolean;
    initiallyExpanded?: boolean;
}

export class RelatedPlanningItem extends React.PureComponent<IProps> {
    containerNode: React.RefObject<HTMLDivElement>;
    public authoringRef: React.RefObject<IAuthoringReact<IPlanningItem>>;;
    public toggleBoxRef: React.RefObject<CustomHeaderToggleBox>;

    constructor(props) {
        super(props);

        this.containerNode = React.createRef();
        this.authoringRef = React.createRef();
        this.toggleBoxRef = React.createRef();

        this.unlink = this.unlink.bind(this);
        this.update = this.update.bind(this);
    }

    scrollIntoView() {
        this.containerNode.current?.scrollIntoView({behavior: 'smooth'});
    }

    unlink() {
        this.props.unlinkPlanning(this.props.item);
    }

    update(updates: DeepPartial<IPlanningItem>, scrollOnChange: boolean = true) {
        this.props.updatePlanningItem(this.props.item, updates, scrollOnChange);
    }

    focus() {
        if (this.containerNode.current != null) {
            this.containerNode.current.focus();
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {WithLiveResources} = superdeskApi.components;
        const {item, isAgendaEnabled} = this.props;
        const hideRemoveIcon = this.props.disabled;

        const renderPlanning = (planningItem: DeepPartial<IPlanningItem>) => (
            <RelatedPlanningListItem
                item={planningItem}
                isAgendaEnabled={isAgendaEnabled}
                showIcon={true}
                shadow={1}
                showBorder
                editPlanningComponent={hideRemoveIcon ? null : (
                    <IconButton
                        icon="close-small"
                        ariaValue={gettext('Unlink related planning')}
                        onClick={this.unlink}
                        toolTipFlow="left"
                    />
                )}
            />
        );

        return (
            <div
                className="planning-item"
                data-test-id={`editor--planning-item__${this.props.index}`}
                id={`planning-item--${item._id}`}
                ref={this.containerNode}
                tabIndex={0}
            >
                <ToggleBox
                    toggleBoxRef={this.toggleBoxRef}
                    variant="custom-header"
                    getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                    alwaysRenderChildren
                    header={
                        isTemporaryId(item._id)
                            ? renderPlanning(item)
                            : (
                                <WithLiveResources resources={[{ids: [item._id], resource: 'planning'}]}>
                                    {(res) => {
                                        const planning: IPlanningItem = res[0]._items[0];

                                        return renderPlanning(planning);
                                    }}
                                </WithLiveResources>
                            )
                    }
                >
                    <PlanningEditorStandalone
                        editorRef={this.authoringRef}
                        itemId={item._id}
                        authoringStorage={
                            isTemporaryId(item._id)
                                ? getAuthoringStorageInMemory(
                                    'planning',
                                    item as IPlanningItem,
                                    (item) => {
                                        /**
                                         * When adding a new embedded planning, this save call will come from
                                         * ItemManager via handleEmbeddedItems in save-handling.ts
                                         */
                                        const fieldsToOmit = [
                                            '_temporary', '_created', '_etag', '_links', '_updated',
                                        ] satisfies Array<keyof IPlanningItem>;
                                        const itemClean = omit(
                                            modifyForServer(item, true),
                                            fieldsToOmit,
                                        );

                                        return planningApi.planning.create(itemClean)
                                            .then((created) =>
                                                planningApi.locks.unlockItem(created)
                                                    .then((unlocked) => {
                                                        this.update(unlocked);

                                                        return unlocked;
                                                    })
                                            );
                                    },
                                ) : authoringStoragePlanningItemHttp
                        }
                        makeVisible={() => {
                            if (this.toggleBoxRef.current.isOpen()) {
                                return Promise.resolve();
                            }

                            return this.toggleBoxRef.current.toggle().then(() => null);
                        }}
                    />
                </ToggleBox>
            </div>
        );
    }
}

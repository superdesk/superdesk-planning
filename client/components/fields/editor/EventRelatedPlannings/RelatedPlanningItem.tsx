import * as React from 'react';

import {
    EDITOR_TYPE,
    IEventItem,
    IPlanningContentProfile,
    IPlanningItem,
    ISearchProfile
} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {IconButton, ToggleBox} from 'superdesk-ui-framework/react';
import {RelatedPlanningListItem} from '../../../RelatedPlannings/PlanningMetaData/RelatedPlanningListItem';
import {PlanningEditorStandalone} from '../../../editor-standalone/planning-editor-standalone';
import {TEMP_ID_PREFIX} from '../../../../constants';
import {authoringStoragePlanningItemHttp} from '../../../editor-standalone/authoring-storage-planning-http';
import {
    getAuthoringStorageInMemory
} from '../../../editor-standalone/authoring-storage-in-memory';

interface IProps {
    event: IEventItem;
    item: DeepPartial<IPlanningItem>;
    index: number;
    disabled: boolean;
    editorType: EDITOR_TYPE;
    profile: IPlanningContentProfile;
    coverageProfile?: ISearchProfile;
    removePlan(item: DeepPartial<IPlanningItem>): void;
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

    constructor(props) {
        super(props);

        this.containerNode = React.createRef();

        this.remove = this.remove.bind(this);
        this.update = this.update.bind(this);
    }

    scrollIntoView() {
        this.containerNode.current?.scrollIntoView({behavior: 'smooth'});
    }

    remove() {
        this.props.removePlan(this.props.item);
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
                editPlanningComponent={hideRemoveIcon ? null : (
                    <IconButton
                        icon="trash"
                        ariaValue={gettext('Remove planning')}
                        onClick={this.remove}
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
                    variant="custom-header"
                    getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                    header={
                        item._id.startsWith(TEMP_ID_PREFIX)
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
                        itemId={item._id}
                        authoringStorage={
                            item._id.startsWith(TEMP_ID_PREFIX)
                                ? getAuthoringStorageInMemory(
                                    item as IPlanningItem,
                                    (item) => {
                                        this.update(item);

                                        return Promise.resolve(item);
                                    },
                                )
                                : authoringStoragePlanningItemHttp
                        }
                    />
                </ToggleBox>
            </div>
        );
    }
}

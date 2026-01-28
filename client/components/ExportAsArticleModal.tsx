import React from 'react';
import {connect} from 'react-redux';

import {IDesk, ITemplate} from 'superdesk-api';
import {superdeskApi} from '../superdeskApi';
import {IEventOrPlanningItem, ILockedItems, IPlanningExportTemplate} from '../interfaces';

import {PERSONAL_WORKSPACE} from '../constants';
import {lockUtils} from '../utils';
import * as selectors from '../selectors';

import SortItems from './SortItems/index';
import {RelatedEventListItem} from './Events/EventMetadata/RelatedEventListItem';
import {RelatedPlanningListItem} from './RelatedPlannings/PlanningMetaData/RelatedPlanningListItem';
import {
    Alert,
    Button,
    ButtonGroup,
    FormLayout,
    FormGroupV2,
    FormGroupItem,
    Select,
    Option,
    Spacer,
    Modal,
} from 'superdesk-ui-framework/react';

interface IOwnProps {
    handleHide(): void;
    modalProps: {
        items: Array<IEventOrPlanningItem>;
        download: boolean;
        type: IEventOrPlanningItem['type'];
        defaultDeskId: IDesk['_id'];
        action(
            items: Array<IEventOrPlanningItem>,
            desk: IDesk['_id'],
            planningTemplate: IPlanningExportTemplate['name'],
            type: IEventOrPlanningItem['type'],
            download: boolean,
            articleTemplate: ITemplate['_id'],
        ): void;
    };
}

interface IReduxStateProps {
    articleTemplates: Array<ITemplate>;
    userDesks: Array<IDesk>;
    lockedItems: ILockedItems;
    planningTemplates: Array<IPlanningExportTemplate>;
}

type IProps = IOwnProps & IReduxStateProps;

interface IState {
    planningTemplateName?: IPlanningExportTemplate['name'];
    deskId?: IDesk['_id'];
    items: Array<IEventOrPlanningItem>;
    selectedItems: Array<IEventOrPlanningItem['_id']>;
    articleTemplateId?: ITemplate['_id'];
    articleTemplates: Array<ITemplate>;
}

const mapStateToProps = (state: any, ownProps: IOwnProps) => ({
    articleTemplates: selectors.general.templates(state),
    userDesks: selectors.general.userDesks(state),
    lockedItems: selectors.locks.getLockedItems(state),
    planningTemplates: (ownProps.modalProps.type === 'planning' ?
        selectors.general.getPlanningExportTemplates(state) :
        selectors.general.getEventExportTemplates(state)
    ).filter((planningTemplate) => (
        ownProps.modalProps.download ? planningTemplate.download === true : planningTemplate.download !== true
    )),
});

class ExportAsArticleModalComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const {defaultDeskId, type} = this.props.modalProps;
        const [articleTemplateId, articleTemplates] = this.getFilteredArticleTemplates(defaultDeskId);
        const defaultTemplateName = this.props.planningTemplates.find((planningTemplate) => (
            (type === 'planning' && planningTemplate.name === 'default_planning')
            || (type !== 'planning' && planningTemplate.name === 'default_event')
        ))?.name;

        this.state = {
            planningTemplateName: defaultTemplateName,
            deskId: this.props.modalProps.defaultDeskId,
            items: this.props.modalProps.items,
            selectedItems: this.props.modalProps.items
                .filter((item) => !lockUtils.isItemLocked(item, this.props.lockedItems))
                .map((item) => item._id),
            articleTemplateId: articleTemplateId,
            articleTemplates: articleTemplates,
        };
    }

    onChangeDesk = (deskId: IDesk['_id']) => {
        // on desk change filter article-templates based on desk selected
        const [articleTemplateId, articleTemplates] = this.getFilteredArticleTemplates(deskId);

        this.setState({
            deskId: deskId,
            articleTemplateId: articleTemplateId,
            articleTemplates: articleTemplates,
        });
    }

    onChangeTemplate = (templateId: ITemplate['_id']) => {
        this.setState({articleTemplateId: templateId});
    }

    onChangePlanningTemplate = (planningTemplateName: IPlanningExportTemplate['name']) => {
        this.setState({planningTemplateName: planningTemplateName});
    }

    onSubmit = () => {
        const {deskId, planningTemplateName, items, articleTemplateId} = this.state;
        const {type, download} = this.props.modalProps;

        const selectedItems = items.filter(
            (item) => this.state.selectedItems.includes(item._id)
        );

        this.props.modalProps.action(selectedItems, deskId, planningTemplateName, type, download, articleTemplateId);
        this.props.handleHide();
    }

    onSortChange = (items: Array<IEventOrPlanningItem>) => {
        this.setState({items: items});
    }

    getFilteredArticleTemplates(deskId: IDesk['_id']): [ITemplate['_id'], Array<ITemplate>] {
        if (deskId === PERSONAL_WORKSPACE._id) {
            return [null, []];
        }

        const desk = this.props.userDesks.find((desk) => desk._id === deskId);

        if (desk == null) {
            console.warn('Desk not found, cannot filter article templates');
            return [null, []];
        }

        const articleTemplates = this.props.articleTemplates.filter(
            (articleTemplate) => (articleTemplate.template_desks?.includes(deskId))
        );

        return [
            (articleTemplates.find(
                (articleTemplate) => (articleTemplate._id === desk.default_content_template)
            ) || articleTemplates[0])?._id,
            articleTemplates,
        ];
    }

    toggleItemSelection = (item: IEventOrPlanningItem) => {
        this.setState((prevState) => {
            if (prevState.selectedItems.includes(item._id)) {
                return {
                    selectedItems: prevState.selectedItems.filter((itemId) => itemId !== item._id),
                    // Re-assign items to a new value so `SortItems` re-renders
                    items: [...prevState.items],
                };
            } else {
                return {
                    selectedItems: [...prevState.selectedItems, item._id],
                    // Re-assign items to a new value so `SortItems` re-renders
                    items: [...prevState.items],
                };
            }
        });
    }

    includeAllLockedItems = () => {
        this.setState((prevState) => {
            const unselectedLockedItemIds = this.getLockedItemIds().filter(
                (itemId) => !prevState.selectedItems.includes(itemId)
            );

            return {
                selectedItems: [...prevState.selectedItems, ...unselectedLockedItemIds],
                // Re-assign items to a new value so `SortItems` re-renders
                items: [...prevState.items],
            };
        });
    }

    excludeAllLockedItems = () => {
        this.setState((prevState) => {
            const lockedItemIds = this.getLockedItemIds();

            return {
                selectedItems: prevState.selectedItems.filter((itemId) => !lockedItemIds.includes(itemId)),
                // Re-assign items to a new value so `SortItems` re-renders
                items: [...prevState.items],
            };
        });
    }

    getListElement = (item: IEventOrPlanningItem) => {
        const selected = this.state.selectedItems.includes(item._id);

        if (item.type === 'event') {
            return (
                <RelatedEventListItem
                    item={item}
                    showIcon={true}
                    shadow={1}
                    showBorder={true}
                    active={selected}
                    showCheckbox={true}
                    checked={selected}
                    onCheckToggle={this.toggleItemSelection.bind(this, item)}
                    noColumnPadding={true}
                />
            );
        } else if (item.type === 'planning') {
            return (
                <RelatedPlanningListItem
                    item={item}
                    showIcon={true}
                    shadow={1}
                    showBorder={true}
                    isAgendaEnabled={false}
                    active={selected}
                    showCheckbox={true}
                    checked={selected}
                    onCheckToggle={this.toggleItemSelection.bind(this, item)}
                    noColumnPadding={true}
                />
            );
        } else {
            throw new Error('no other options');
        }
    }

    getLockedItemIds(): Array<IEventOrPlanningItem['_id']> {
        return this.state.items
            .filter((item) => lockUtils.isItemLocked(item, this.props.lockedItems))
            .map((item) => item._id);
    }

    render() {
        const {gettext, gettextPlural} = superdeskApi.localization;
        const lockedItemIds = this.getLockedItemIds();
        const unselectedLockedItemIds = lockedItemIds.filter((itemId) => !this.state.selectedItems.includes(itemId));

        return (
            <Modal
                visible={true}
                size="large"
                position="top"
                headerTemplate={gettext('Export as article')}
                onHide={this.props.handleHide}
                closeOnEscape={true}
                footerTemplate={(
                    <ButtonGroup align="end">
                        <Button type="default" onClick={this.props.handleHide} text={gettext('Cancel')} />
                        {this.props.modalProps.download !== true ? (
                            <Button
                                type="primary"
                                disabled={this.state.deskId == null}
                                onClick={this.onSubmit}
                                text={gettext('Export')}
                            />
                        ) : (
                            <Button type="primary" onClick={this.onSubmit} text={gettext('Download')} />
                        )}
                    </ButtonGroup>
                )}
            >
                <FormLayout spaces="compact" className="mb-4">
                    {this.props.modalProps.download === true ? null : (
                        <React.Fragment>
                            <FormGroupV2>
                                <FormGroupItem>
                                    <Select
                                        label={gettext('Desk')}
                                        value={this.state.deskId}
                                        onChange={this.onChangeDesk}
                                        required={true}
                                    >
                                        <Option value={PERSONAL_WORKSPACE._id}>
                                            {PERSONAL_WORKSPACE.name}
                                        </Option>
                                        {this.props.userDesks.map((desk) => (
                                            <Option key={desk._id} value={desk._id}>{desk.name}</Option>
                                        ))}
                                    </Select>
                                </FormGroupItem>
                            </FormGroupV2>
                            <FormGroupV2>
                                <FormGroupItem>
                                    <Select
                                        label={gettext('Article Template')}
                                        value={this.state.articleTemplateId}
                                        onChange={this.onChangeTemplate}
                                    >
                                        <Option />
                                        {this.state.articleTemplates.map((articleTemplate) => (
                                            <Option key={articleTemplate._id} value={articleTemplate._id}>
                                                {articleTemplate.template_name}
                                            </Option>
                                        ))}
                                    </Select>
                                </FormGroupItem>
                            </FormGroupV2>
                        </React.Fragment>
                    )}

                    <FormGroupV2>
                        <FormGroupItem>
                            <Select
                                label={gettext('Custom Layout')}
                                value={this.state.planningTemplateName}
                                onChange={this.onChangePlanningTemplate}
                            >
                                <Option />
                                {this.props.planningTemplates.map((planningTemplate) => (
                                    <Option key={planningTemplate.name} value={planningTemplate.name}>
                                        {planningTemplate.label}
                                    </Option>
                                ))}
                            </Select>
                        </FormGroupItem>
                    </FormGroupV2>
                </FormLayout>
                {lockedItemIds.length === 0 ? null : (
                    <React.Fragment>
                        <Alert
                            style="hollow"
                            size="normal"
                            margin="small"
                            icon="warning-sign"
                            type="warning"
                            restoreIcon="info"
                        >
                            <Spacer v={true} gap="4">
                                {gettextPlural(
                                    lockedItemIds.length,
                                    'One of the items that was selected is locked. ' +
                                    'By default locked items are not included in the export.',
                                    '{{ count }} items that were selected are locked. ' +
                                    'By default locked items are not included in the export.',
                                    {count: lockedItemIds.length}
                                )}
                                <ButtonGroup align="end">
                                    <Button
                                        type="tertiary"
                                        size="small"
                                        onClick={unselectedLockedItemIds.length > 0 ?
                                            this.includeAllLockedItems :
                                            this.excludeAllLockedItems
                                        }
                                        text={unselectedLockedItemIds.length > 0 ?
                                            gettext('Include all locked items') :
                                            gettext('Exclude all locked items')
                                        }
                                    />
                                </ButtonGroup>
                            </Spacer>
                        </Alert>
                    </React.Fragment>
                )}
                <SortItems
                    items={this.state.items}
                    onSortChange={this.onSortChange}
                    getListElement={this.getListElement}
                />
            </Modal>
        );
    }
}

export const ExportAsArticleModal = connect<IReduxStateProps, {}, IOwnProps>(
    mapStateToProps
)(ExportAsArticleModalComponent);

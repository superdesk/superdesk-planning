import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {get} from 'lodash';
import {gettext, eventUtils, planningUtils} from '../../../utils';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {HistoryTab} from '../index';
import {PreviewContentTab, PreviewHeader} from './index';
import {Tabs} from '../../UI/Nav';
import {SidePanel, Header, Tools, Content} from '../../UI/SidePanel';
import {ITEM_TYPE, TOOLTIPS} from '../../../constants';

export class PreviewPanelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0};

        this.openEditPanel = this.openEditPanel.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);

        this.tools = [
            {
                icon: 'icon-close-small',
                onClick: (event) => {
                    this.props.closePreview();

                    document.dispatchEvent(
                        new CustomEvent(
                            'superdesk-planning.close-preview',
                            {...event, detail: {itemId: this.props.itemId}},
                        ),
                    );
                },
                title: gettext(TOOLTIPS.close),
            },
        ];

        this.tabs = [
            {
                label: gettext('Content'),
                render: PreviewContentTab,
                enabled: true,
            },
        ];
        if (!get(props, 'hideHistory', false)) {
            this.tabs.push(
                {
                    label: gettext('History'),
                    render: HistoryTab,
                    enabled: true,
                }
            );
        }

        this.dom = {panel: null};
    }

    componentDidMount() {
        if (this.props.itemId && this.props.itemType) {
            this.props.loadPreviewItem(this.props.itemId, this.props.itemType);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'initialLoad') && this.props.initialLoad !== nextProps.initialLoad) {
            this.setActiveTab(0);
        }

        if (nextProps.itemId === null) {
            // Preview closed
            this.setActiveTab(0);
        }

        if (nextProps.itemId !== null && nextProps.itemId !== this.props.itemId) {
            // Using setTimeout allows the PreviewPanel to clear before displaying the new item
            setTimeout(() => {
                this.props.loadPreviewItem(nextProps.itemId, nextProps.itemType);
            }, 0);
        }

        this.tabs[0].label = nextProps.itemType === ITEM_TYPE.EVENT ?
            gettext('Event Details') :
            gettext('Planning Details');

        if (!this.props.hideEditIcon && get(nextProps, 'item')) {
            if ((nextProps.itemType === ITEM_TYPE.EVENT && eventUtils.canEditEvent(
                nextProps.item,
                nextProps.session,
                nextProps.privileges,
                nextProps.lockedItems
            )) || (nextProps.itemType === ITEM_TYPE.PLANNING) && planningUtils.canEditPlanning(
                nextProps.item,
                null,
                nextProps.session,
                nextProps.privileges,
                nextProps.lockedItems
            )) {
                if (this.tools[0].icon !== 'icon-pencil') {
                    this.tools.unshift(
                        {
                            icon: 'icon-pencil',
                            onClick: this.openEditPanel.bind(this, false),
                            title: gettext(TOOLTIPS.edit),
                        },
                        {
                            icon: 'icon-external',
                            onClick: this.openEditPanel.bind(this, true),
                            title: gettext(TOOLTIPS.editModal),
                        });
                }
            } else if (this.tools[0].icon === 'icon-pencil') {
                this.tools.shift();
                this.tools.shift();
            }
        }
    }

    openEditPanel(modal = false) {
        this.props.edit(this.props.item, modal);
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    render() {
        const currentTab = this.tabs[this.state.tab];
        const RenderTab = currentTab.render;
        const isEvent = this.props.itemType === ITEM_TYPE.EVENT;

        return (
            <SidePanel shadowRight={true} bg00={true}>
                <Header darkBlue={isEvent} darker={!isEvent}>
                    <Tools tools={this.tools} />
                    <Tabs
                        tabs={this.tabs}
                        active={this.state.tab}
                        setActive={this.setActiveTab}
                        darkUi={isEvent}
                    />
                </Header>
                {!this.props.previewLoading && this.props.item && (
                    <Content>
                        {currentTab.label !== 'History' && (
                            <PreviewHeader
                                item={this.props.item}
                                hideItemActions={this.props.hideItemActions}
                                showUnlock={this.props.showUnlock}
                            />
                        )}
                        <div tabIndex={-1} id="preview-content">
                            <h3 className="a11y-only">{gettext('Item preview')}</h3>

                            <RenderTab
                                item={this.props.item}
                                hideRelatedItems={this.props.hideRelatedItems}
                                hideEditIcon={this.props.hideEditIcon}
                            />
                        </div>
                    </Content>
                )}
            </SidePanel>
        );
    }
}

PreviewPanelComponent.propTypes = {
    item: PropTypes.object,
    itemId: PropTypes.string,
    itemType: PropTypes.string,
    previewLoading: PropTypes.bool,
    inPlanning: PropTypes.bool,
    loadPreviewItem: PropTypes.func,
    edit: PropTypes.func.isRequired,
    closePreview: PropTypes.func,
    initialLoad: PropTypes.bool,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    hideEditIcon: PropTypes.bool,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    hideRelatedItems: PropTypes.bool,
    hideHistory: PropTypes.bool,
};

PreviewPanelComponent.defaultProps = {initialLoad: false};

const mapStateToProps = (state) => ({
    item: selectors.main.getPreviewItem(state),
    itemId: selectors.main.previewId(state),
    itemType: selectors.main.previewType(state),
    previewLoading: selectors.main.previewLoading(state),
    privileges: selectors.general.privileges(state),
    lockedItems: selectors.locks.getLockedItems(state),
    session: selectors.general.session(state),
});

const mapDispatchToProps = (dispatch) => ({
    loadPreviewItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'preview')),
    edit: (item, modal = false) => dispatch(actions.main.openForEdit(item, !modal, modal)),
    closePreview: () => dispatch(actions.main.closePreview()),
});

export const PreviewPanel = connect(
    mapStateToProps,
    mapDispatchToProps
)(PreviewPanelComponent);

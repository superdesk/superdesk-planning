import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {get} from 'lodash';
import {gettext} from '../../../utils';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {HistoryTab} from '../index';
import {PreviewContentTab, PreviewHeader} from './index';
import {Tabs} from '../../UI/Nav';
import {SidePanel, Header, Tools, Content} from '../../UI/SidePanel';
import {WORKSPACE, TOOLTIPS} from '../../../constants';

export class PreviewPanelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0};

        this.openEditPanel = this.openEditPanel.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);

        this.tools = [
            {
                icon: 'icon-close-small',
                onClick: this.props.closePreview,
                title: gettext(TOOLTIPS.close),
            },
        ];

        this.tabs = [
            {
                label: gettext('Content'),
                render: PreviewContentTab,
                enabled: true,
            },
            {
                label: gettext('History'),
                render: HistoryTab,
                enabled: true,
            },
        ];

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

        if (nextProps.itemId !== null && nextProps.itemId !== this.props.itemId) {
            // Using setTimeout allows the PreviewPanel to clear before displaying the new item
            setTimeout(() => {
                this.props.loadPreviewItem(nextProps.itemId, nextProps.itemType);
            }, 0);
        }

        if (this.props.inPlanning && get(nextProps, 'item')) {
            if (get(nextProps.item, 'state') !== 'spiked') {
                if (this.tools[0].icon !== 'icon-pencil') {
                    this.tools.unshift({
                        icon: 'icon-pencil',
                        onClick: this.openEditPanel,
                        title: gettext(TOOLTIPS.edit),
                    });
                }
            } else if (this.tools[0].icon === 'icon-pencil') {
                this.tools.shift();
            }
        }
    }

    openEditPanel() {
        this.props.edit(this.props.item);
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    render() {
        const currentTab = this.tabs[this.state.tab];
        const RenderTab = currentTab.render;

        return (
            <SidePanel shadowRight={true}>
                <Header>
                    <Tools tools={this.tools}/>
                    <Tabs
                        tabs={this.tabs}
                        active={this.state.tab}
                        setActive={this.setActiveTab}
                    />
                </Header>
                {!this.props.previewLoading && this.props.item && (
                    <Content>
                        {currentTab.label !== 'History' &&
                        <PreviewHeader item={this.props.item}/>
                        }
                        <RenderTab item={this.props.item}/>
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
};

PreviewPanelComponent.defaultProps = {initialLoad: false};

const mapStateToProps = (state) => ({
    item: selectors.main.getPreviewItem(state),
    itemId: selectors.main.previewId(state),
    itemType: selectors.main.previewType(state),
    previewLoading: selectors.main.previewLoading(state),
    inPlanning: selectors.getCurrentWorkspace(state) === WORKSPACE.PLANNING,
});

const mapDispatchToProps = (dispatch) => ({
    loadPreviewItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'preview')),
    edit: (item) => dispatch(actions.main.lockAndEdit(item)),
    closePreview: () => dispatch(actions.main.closePreview()),
});

export const PreviewPanel = connect(
    mapStateToProps,
    mapDispatchToProps
)(PreviewPanelComponent);

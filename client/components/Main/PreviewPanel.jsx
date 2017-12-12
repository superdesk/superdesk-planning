import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash'

import {gettext} from '../../utils';

import {HistoryTab, PreviewContentTab, PreviewHeader} from './';

import {Tabs} from '../UI/Nav';
import {Panel} from '../UI/Preview';
import {SidePanel, Header, Tools, Content, ContentBlock} from '../UI/SidePanel';

export class PreviewPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0};

        this.openEditPanel = this.openEditPanel.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);

        this.tools = [
            {
                icon: 'icon-pencil',
                onClick: this.openEditPanel,
            },
            {
                icon: 'icon-close-small',
                onClick: this.closePreview,
            },
        ];

        this.tabs = [
            {
                label: gettext('Content'),
                render: PreviewContentTab,
            },
            {
                label: gettext('History'),
                render: HistoryTab,
            },
        ];
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'initialLoad') && this.props.initialLoad !== nextProps.initialLoad) {
            this.setActiveTab(0)
        }
    }

    openEditPanel() {
        this.props.edit(this.props.item);
    }

    closePreview() {
        this.props.closePreview();
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    render() {
        const currentTab = this.tabs[this.state.tab]
        const RenderTab = currentTab.render;

        return (
            <Panel>
                <SidePanel shadowRight={true}>
                    <Header>
                        <Tools tools={this.tools} />
                        <Tabs
                            tabs={this.tabs}
                            active={this.state.tab}
                            setActive={this.setActiveTab}
                        />
                    </Header>
                    {this.props.item && (
                        <Content>
                            {currentTab.label !== 'History' &&
                                <PreviewHeader item={this.props.item} />
                            }
                            <ContentBlock>
                                <RenderTab item={this.props.item} />
                            </ContentBlock>
                        </Content>
                    )}
                </SidePanel>
            </Panel>
        );
    }
}

PreviewPanel.propTypes = {
    item: PropTypes.object,
    edit: PropTypes.func.isRequired,
    closePreview: PropTypes.func.isRequired,
    initialLoad: PropTypes.bool,
};

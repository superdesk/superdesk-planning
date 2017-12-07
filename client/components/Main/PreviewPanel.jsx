import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {HistoryTab, PreviewContentTab} from './';

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
        const RenderTab = this.tabs[this.state.tab].render;

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
};

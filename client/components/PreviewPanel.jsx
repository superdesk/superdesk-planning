import React from 'react';
import PropTypes from 'prop-types';

import { gettext } from '../utils';

import NavTabs from './NavTabs';
import HistoryTab from './HistoryTab';
import PreviewContentTab from './PreviewContentTab';

class PreviewPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0};
    }

    render() {
        const tools = [
            {
                icon: 'icon-pencil',
                onClick: () => this.props.edit(this.props.item),
            },
            {
                icon: 'icon-close-small',
                onClick: () => this.props.closePreview(),
            },
        ];

        const tabs = [
            {
                label: gettext('Content'),
                render: PreviewContentTab,
            },
            {
                label: gettext('History'),
                render: HistoryTab,
            },
        ];

        const RenderTab = tabs[this.state.tab].render;

        return (
            <div className="sd-preview-panel">
                <div className="side-panel side-panel--shadow-right">
                    <div className="side-panel__header">
                        <div className="side-panel__tools">
                            {tools.map((tool) => (
                                <a key={tool.icon} className="icn-btn" onClick={tool.onClick}>
                                    <i className={tool.icon} />
                                </a>
                            ))}
                        </div>
                        <NavTabs
                            tabs={tabs}
                            active={this.state.tab}
                            setActive={(tab) => this.setState({tab})}
                        />
                    </div>
                    {this.props.item && (
                        <div className="side-panel__content">
                            <div className="side-panel__content-block">
                                <RenderTab item={this.props.item} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

PreviewPanel.propTypes = {
    item: PropTypes.object,
    edit: PropTypes.func.isRequired,
    closePreview: PropTypes.func.isRequired,
};

export default PreviewPanel;

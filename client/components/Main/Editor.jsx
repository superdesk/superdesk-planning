import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';

import {
    HistoryTab,
    EditorContentTab
} from './';

import {Button as NavButton, Tabs as NavTabs} from '../UI/Nav';
import {StretchBar} from '../UI/SubNav';
import {SidePanel, Header, Content, ContentBlock} from '../UI/SidePanel';

export class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0, diff: null, dirty: false};
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);

        this.tabs = [
            {label: gettext('Content'), render: EditorContentTab},
            {label: gettext('History'), render: HistoryTab},
        ];
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'item._id') !== get(this.props, 'item._id')) {
            const diff = Object.assign({}, nextProps.item);

            this.setState({diff: diff, dirty: false});
        }
    }

    onChangeHandler(field) {
        return (event) => {
            const diff = Object.assign({}, this.state.diff);

            diff[field] = event.target.value;
            this.setState({diff: diff, dirty: true});
        };
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    render() {
        const RenderTab = this.tabs[this.state.tab].render;

        return (
            <SidePanel shadowRight={true}>
                <Header className="subnav">
                    <StretchBar>
                        <figure className="avatar" style={{marginRight: 10}}>{'sd'}</figure>
                    </StretchBar>
                    <StretchBar right={true}>
                        <button className="btn" onClick={this.props.cancel}>
                            {gettext('Cancel')}
                        </button>
                        <button className="btn btn--success">
                            {gettext('Publish')}
                        </button>
                        <button className="btn btn--primary" disabled={!this.state.dirty}>
                            {gettext('Save')}
                        </button>
                    </StretchBar>
                    <NavButton onClick={this.props.minimize} icon="big-icon--minimize" />
                    <NavButton icon="icon-dots-vertical" />
                </Header>
                <Content flex={true}>
                    <NavTabs
                        tabs={this.tabs}
                        active={this.state.tab}
                        setActive={this.setActiveTab}
                        className="side-panel__content-tab-nav"
                    />
                    {this.props.item && (
                        <div className="side-panel__content-tab-content">
                            <ContentBlock>
                                <RenderTab
                                    item={this.props.item}
                                    diff={this.state.diff}
                                    onChangeHandler={this.onChangeHandler}
                                />
                            </ContentBlock>
                        </div>
                    )}
                </Content>
            </SidePanel>
        );
    }
}

Editor.propTypes = {
    item: PropTypes.object,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
};

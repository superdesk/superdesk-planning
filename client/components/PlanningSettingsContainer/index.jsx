import React from 'react'
import { Tabs, Tab, TabContent, ModalsContainer, AgendasListContainer } from '../../components'

export class PlanningSettingsContainer extends React.Component {
    constructor(props) {
        super(props)
        this.tabs = { AGENDA: 'Agenda' }
        this.state = { activeTab: this.tabs.AGENDA }
    }

    onChangeTab(tabName) {
        this.setState({ activeTab: tabName })
    }

    render() {
        return (
            <div className="split-content">
                <Tabs>
                    <Tab tabName={this.tabs.AGENDA}
                         activeTab={this.state.activeTab}
                         onChangeTab={this.onChangeTab.bind(this, this.tabs.AGENDA)}
                         key={'settings-'+ this.tabs.AGENDA} />
                </Tabs>
                <div className="content">
                    <TabContent tabName={this.tabs.AGENDA} activeTab={this.state.activeTab}>
                        <AgendasListContainer />
                    </TabContent>
                </div>
                <ModalsContainer />
            </div>
        )
    }
}

PlanningSettingsContainer.propTypes = {}
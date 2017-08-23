import React from 'react'
import { Tabs, Tab, ModalsContainer, AgendasListContainer } from '../../components'

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
            <div>
                <div className="sd-page__header sd-page__header--white">
                    <h2 className="sd-page__page-heading">Planning</h2>
                </div>
                <div className="sd-page__header sd-page__header--white">
                    <Tabs>
                        <Tab tabName={this.tabs.AGENDA}
                             activeTab={this.state.activeTab}
                             onChangeTab={this.onChangeTab.bind(this, this.tabs.AGENDA)}
                             key={'settings-'+ this.tabs.AGENDA} />
                    </Tabs>
                </div>
                {this.tabs.AGENDA === this.state.activeTab && <AgendasListContainer />}
                <ModalsContainer />
            </div>
        )
    }
}

PlanningSettingsContainer.propTypes = {}
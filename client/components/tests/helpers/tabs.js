import {Tabs, Tab} from '../../';

export default class tabs {
    constructor(element, activeTabName = 'activeTab') {
        this.element = element;
        this.tabs = element.find(Tabs);
        this.activeTabName = activeTabName;
        this.isMounted = this.tabs.exists();
    }

    labels() {
        return this.tabs.find(Tab).map(((tab) => tab.prop('tabName')));
    }

    getTab(tabName) {
        return this.tabs.find(Tab).find({tabName});
    }

    getActiveTab() {
        return this.element.state(this.activeTabName);
    }

    setActiveTab(tabName) {
        const tab = this.getTab(tabName);

        if (tab.exists()) {
            tab.simulate('click');
        } else {
            this.element.setState({[this.activeTabName]: tabName});
        }
    }
}

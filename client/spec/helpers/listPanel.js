class ListPanel {
    constructor() {
        this.listPanel = element(by.className('sd-column-box__main-column__listpanel'));
    }

    getItemCount() {
        return this.listPanel.all(by.className('sd-list-item')).count();
    }

    getGroup(groupHeaderName) {
        return this.getGroups().filter((group) => (
            group.element(by.className('sd-list-header__name')).getText()
                .then((text) => text.toUpperCase() === groupHeaderName.toUpperCase())))
            .first();
    }

    getGroups() {
        return this.listPanel.all(by.className('ListGroup'));
    }

    getGroupItems(groupHeaderName) {
        return this.getGroup(groupHeaderName).all(by.className('sd-list-item'));
    }

    getItemInGroupAtIndex(groupHeaderName, index) {
        return this.getGroupItems(groupHeaderName).get(index);
    }
}

export const listPanel = new ListPanel();

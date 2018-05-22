module.exports = new ListPanel();

function ListPanel() {
    this.listPanel = element(by.className('sd-column-box__main-column__listpanel'));

    this.getItemCount = () => (this.listPanel.all(by.className('sd-list-item')).count());

    this.getGroup = (groupHeaderName) => (
        this.getGroups().filter((group) => (
            group.element(by.className('sd-list-header__name')).getText()
                .then(
                    (text) => text.toUpperCase() === groupHeaderName.toUpperCase())
        ))
            .first());

    this.getGroups = () => (this.listPanel.all(by.className('ListGroup')));

    this.getGroupItems = (groupHeaderName) => (
        this.getGroup(groupHeaderName).all(by.className('sd-list-item')));

    this.getItemInGroupAtIndex = (groupHeaderName, index) => (
        this.getGroupItems(groupHeaderName).get(index));
}

class Workqueue {
    constructor() {
        this.panel = element(by.className('opened-articles'));
    }

    getItems() {
        return this.panel.all(by.className('workqueue-item'));
    }

    getItemCount() {
        return this.getItems().count();
    }

    getItem(index) {
        return new WorkqueueItem(this.getItems().get(index));
    }

    getItemTitles() {
        return this.getItems().map((item) => (new WorkqueueItem(item)).getTitle());
    }
}

class WorkqueueItem {
    constructor(panelItem) {
        this.panelItem = panelItem;
    }

    getTitle() {
        return this.panelItem.element(by.className('item-label')).getText();
    }

    isTitle(newTitle) {
        return this.getTitle()
            .then((text) => Promise.resolve(text === newTitle));
    }

    openItem() {
        this.panelItem.click();
        browser.sleep(1500);
    }
}

export const workqueue = new Workqueue();

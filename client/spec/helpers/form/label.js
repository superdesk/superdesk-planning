export class Label {
    constructor(form, name, type = 'label') {
        this.label = form.element(
            by.xpath(`//${type}[@name="${name}"]`)
        );
        this.name = name;
    }

    getValue() {
        return this.label.getText();
    }
}

import { ToggleBox } from '../../'

export default class toggleBox {
    constructor(element) {
        this.element = element.find(ToggleBox)
        this.header = element.find('.toggle-box__header')
        this.label = element.find('.toggle-box__label')
    }

    click() {
        return this.header.simulate('click')
    }

    title() {
        return this.label.text()
    }

    isOpen() {
        return !this.element.hasClass('hidden')
    }

    find(params) {
        return this.element.find(params)
    }
}

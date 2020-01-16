
export function waitForPageLoad() {
    cy.log('UI.waitForPageLoad');
    // Set the timeout waiting for this button to 60 seconds
    // as this can sometimes take a while on initial load
    cy.get('.icon-plus-large', {timeout: 60000});
}

export {ActionMenu} from './actionMenu';
export {Modal} from './modal';
export {Popup} from './popup';
export {SubNavBar} from './subNavBar';
export {Workqueue} from './workqueue';

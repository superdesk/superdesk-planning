
export function waitForPageLoad() {
    cy.log('UI.waitForPageLoad');
    // Set the timeout waiting for this button to 60 seconds
    // as this can sometimes take a while on initial load

    // Wait for the xhr request to complete for retrieving list of events & planning
    cy.server();
    cy.route('GET', '**/api/events_planning_search*').as('getPlanningEventsSearch');
    cy.wait('@getPlanningEventsSearch', {timeout: 180000});

    // Now wait for the plus icon to be present
    cy.get('.icon-plus-large');
}

export {ActionMenu} from './actionMenu';
export {Modal} from './modal';
export {Popup} from './popup';
export {SubNavBar} from './subNavBar';
export {Workqueue} from './workqueue';

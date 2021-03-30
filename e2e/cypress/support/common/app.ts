import {constructUrl} from './utils';

export const baseBackendUrl = 'http://localhost:5000/api/';

/**
 * Function to get the backend url for the given relative url
 * @param uri
 * @returns {*}
 */
export function getBackendUrl(uri) {
    return constructUrl(baseBackendUrl, uri);
}

/**
 * Send a request to the backend using Cypress.request
 * @param {Object} params
 */
export function backendRequest(params) {
    if (params.uri) {
        params.url = getBackendUrl(params.uri);
        delete params.uri;
    }

    if (params.json) {
        params.body = params.json;
        delete params.json;
    }

    params.timeout = params.timeout || 10000;

    cy.request(params);
}

/**
 * Resets the app using the Superdesk-Core pre-populate endpoint
 * @param {string} profile - The pre-populate profile to use
 */
export function resetApp(profile) {
    backendRequest({
        uri: '/prepopulate',
        method: 'POST',
        timeout: 40000,
        json: {profile: profile},
        retryOnStatusCodeFailure: true,
    });
}

/**
 * Using the Planning endpoint planning_prepopulate, adds items to the respective collections
 * Using the resource service of the provided resource type
 * @param {string} resource - The name of the resource service to use
 * @param {Array<Object>} items - The items to add to the resource/collection
 */
export function addItems(resource, items) {
    cy.log('Common.App.addItems');
    backendRequest({
        uri: '/planning_prepopulate',
        method: 'POST',
        timeout: 40000,
        json: {
            resource: resource,
            items: items,
        },
    });
}

/**
 * Helper function to log into Superdesk
 */
export function login() {
    cy.log('Common.App.login');
    cy.get('#login-username')
        .clear()
        .type('admin')
        .should('have.value', 'admin');

    cy.get('#login-password')
        .clear()
        .type('admin')
        .should('have.value', 'admin');

    cy.get('#login-btn')
        .click();
}

/**
 * Setup the test scenario
 * @param {Object} params - The fixture profile to use
 * @param {string} url - The initial URL to visit
 */
export function setup(params, url) {
    cy.visit('/blank.html');
    cy.log('Common.App.setup');
    resetApp(params.fixture_profile);
    cy.visit(url);
}

/**
 * Change the workspace, i.e. Monitoring, Assignments, Planning etc
 * @param {string} name - The data-test-id attribute for the workspace button
 */
export function changeWorkspace(name) {
    cy.get('[data-test-id=workspace-navigation]')
        .get(`[data-test-id=${name}]`)
        .click();
}

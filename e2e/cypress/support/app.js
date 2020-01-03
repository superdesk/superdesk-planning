import {constructUrl} from './utils';

const baseBackendUrl = 'http://localhost:5000/api/';

function getBackendUrl(uri) {
    return constructUrl(baseBackendUrl, uri);
}

/**
 * Do request to backend with retry on error
 *
 * @param {Object} params
 */
function backendRequest(params) {
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

function resetApp(profile) {
    backendRequest({
        uri: '/prepopulate',
        method: 'POST',
        timeout: 40000,
        json: {profile: profile},
    });
}

function login() {
    cy.get('#login-username')
        .type('admin')
        .should('have.value', 'admin');

    cy.get('#login-password')
        .type('admin')
        .should('have.value', 'admin');

    cy.get('#login-btn')
        .click();
}

function setup(params) {
    resetApp(params.fixture_profile);
}

export default {
    getBackendUrl,
    backendRequest,
    resetApp,
    login,
    setup,
};

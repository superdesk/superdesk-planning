import ActionMenu from './actionMenu';
import CollapseBox from './collapseBox';
import ListItem from './listItem';
import ListPanel from './listPanel';
import Modal from './modal';
import Popup from './popup';
import SubNavBar from './subNavBar';
import Workqueue from './workqueue';

function waitForPageLoad() {
    cy.log('UI.waitForPageLoad');
    // Set the timeout waiting for this button to 60 seconds
    // as this can sometimes take a while on initial load
    cy.get('.icon-plus-large', {timeout: 60000});
}

export default {
    ActionMenu,
    CollapseBox,
    ListItem,
    ListPanel,
    Modal,
    Popup,
    SubNavBar,
    Workqueue,
    waitForPageLoad,
};

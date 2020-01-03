import ActionMenu from './actionMenu';
import CollapseBox from './collapseBox';
import ListItem from './listItem';
import ListPanel from './listPanel';
import Modal from './modal';
import Popup from './popup';
import SubNavBar from './subNavBar';
import Workqueue from './workqueue';

function waitForPageLoad() {
    // Set the timeout waiting for this button to 30 seconds
    // as this can sometimes take a while on initial load
    cy.get('.icon-plus-large', {timeout: 30000});
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

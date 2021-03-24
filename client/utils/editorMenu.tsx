import {get} from 'lodash';

const isOpen = (navigation, menuName) => get(navigation, 'openItems', []).indexOf(menuName) > -1;
const onItemClose = (navigation, menuName) => get(navigation, 'onItemClose') ?
    navigation.onItemClose.bind(null, menuName) : undefined;
const onItemOpen = (navigation, menuName) => get(navigation, 'onItemOpen') ?
    navigation.onItemOpen.bind(null, menuName) : undefined;
const onItemFocus = (navigation, menuName) => get(navigation, 'onItemFocus') ?
    navigation.onItemFocus.bind(null, menuName) : undefined;
const forceScroll = (navigation, menuName) => get(navigation, 'scrollToViewItem') ?
    navigation.scrollToViewItem === menuName : false;

// eslint-disable-next-line consistent-this
const self = {
    isOpen,
    onItemClose,
    onItemOpen,
    onItemFocus,
    forceScroll,
};

export default self;

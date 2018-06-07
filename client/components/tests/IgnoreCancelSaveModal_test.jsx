import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {cloneDeep} from 'lodash';

import {eventUtils, generateTempId} from '../../utils';
import * as testData from '../../utils/testData';
import * as helpers from './helpers';

import {IgnoreCancelSaveModalComponent} from '../IgnoreCancelSaveModal';

describe('<IgnoreCancelSaveModal>', () => {
    let wrapper;
    let handleHide;
    let item;
    let itemType;
    let onCancel;
    let onIgnore;
    let onSave;
    let onGoTo;
    let title;
    let autoClose;
    let currentEditId;
    let buttons;

    beforeEach(() => {
        item = eventUtils.modifyForClient(cloneDeep(testData.events[0]));
        itemType = item.type;
        handleHide = sinon.spy();
        onCancel = sinon.spy();
        onIgnore = sinon.spy();
        onSave = sinon.spy();
        onGoTo = null;
        title = 'Test Modal';
        autoClose = false;
    });

    const setWrapper = () => {
        wrapper = mount(
            <IgnoreCancelSaveModalComponent
                handleHide={handleHide}
                modalProps={{
                    item,
                    itemType,
                    onCancel,
                    onIgnore,
                    onSave,
                    onGoTo,
                    title,
                    autoClose,
                }}
                dateFormat="DD/MM/YYYY"
                timeFormat="HH:mm"
                currentEditId={currentEditId}
            />
        );

        resetButtons();
    };

    const resetButtons = () => {
        buttons = {
            ignore: new helpers.ui.Button(wrapper, 'Ignore'),
            cancel: new helpers.ui.Button(wrapper, 'Cancel'),
            save: new helpers.ui.Button(wrapper, 'Save'),
            goto: new helpers.ui.Button(wrapper, 'Go-To'),
            create: new helpers.ui.Button(wrapper, 'Create'),
            update: new helpers.ui.Button(wrapper, 'Update'),
        };
    };

    it('renders the modal buttons', () => {
        // Renders the Ignore/Cancel/Save buttons
        setWrapper();
        expect(buttons.ignore.isMounted).toBeTruthy();
        expect(buttons.cancel.isMounted).toBeTruthy();
        expect(buttons.save.isMounted).toBeTruthy();
        expect(buttons.create.isMounted).toBeFalsy();
        expect(buttons.goto.isMounted).toBeFalsy();
        expect(buttons.update.isMounted).toBeFalsy();

        // Render the Ignore/Cancel/Update buttons
        item.pubstatus = 'usable';
        setWrapper();
        expect(buttons.ignore.isMounted).toBeTruthy();
        expect(buttons.cancel.isMounted).toBeTruthy();
        expect(buttons.save.isMounted).toBeFalsy();
        expect(buttons.create.isMounted).toBeFalsy();
        expect(buttons.goto.isMounted).toBeFalsy();
        expect(buttons.update.isMounted).toBeTruthy();

        // Renders the Ignore/Cancel/Create buttons
        item = {_id: generateTempId(), name: 'Test Event'};
        setWrapper();
        expect(buttons.ignore.isMounted).toBeTruthy();
        expect(buttons.cancel.isMounted).toBeTruthy();
        expect(buttons.save.isMounted).toBeFalsy();
        expect(buttons.create.isMounted).toBeTruthy();
        expect(buttons.goto.isMounted).toBeFalsy();
        expect(buttons.update.isMounted).toBeFalsy();

        // Renders the Ignore/Cancel/GoTo buttons
        onSave = null;
        onGoTo = sinon.spy();
        setWrapper();
        expect(buttons.ignore.isMounted).toBeTruthy();
        expect(buttons.cancel.isMounted).toBeTruthy();
        expect(buttons.save.isMounted).toBeFalsy();
        expect(buttons.create.isMounted).toBeFalsy();
        expect(buttons.goto.isMounted).toBeTruthy();
        expect(buttons.update.isMounted).toBeFalsy();
    });

    it('executes button callbacks', () => {
        setWrapper();
        expect(onIgnore.callCount).toBe(0);
        expect(onCancel.callCount).toBe(0);
        expect(onSave.callCount).toBe(0);
        expect(onGoTo).toBe(null);

        buttons.ignore.click();
        expect(onIgnore.callCount).toBe(1);
        expect(onCancel.callCount).toBe(0);
        expect(onSave.callCount).toBe(0);
        expect(onGoTo).toBe(null);

        buttons.cancel.click();
        expect(onIgnore.callCount).toBe(1);
        expect(onCancel.callCount).toBe(1);
        expect(onSave.callCount).toBe(0);
        expect(onGoTo).toBe(null);

        buttons.save.click();
        expect(onIgnore.callCount).toBe(1);
        expect(onCancel.callCount).toBe(1);
        expect(onSave.callCount).toBe(1);
        expect(onGoTo).toBe(null);

        item.pubstatus = 'usable';
        setWrapper();
        buttons.update.click();
        expect(onIgnore.callCount).toBe(1);
        expect(onCancel.callCount).toBe(1);
        expect(onSave.callCount).toBe(2);
        expect(onGoTo).toBe(null);

        onSave = null;
        onGoTo = sinon.spy();
        setWrapper();
        buttons.goto.click();
        expect(onIgnore.callCount).toBe(1);
        expect(onCancel.callCount).toBe(1);
        expect(onSave).toBe(null);
        expect(onGoTo.callCount).toBe(1);
    });
});

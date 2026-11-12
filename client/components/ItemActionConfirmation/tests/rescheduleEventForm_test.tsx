import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';
import {RescheduleEventForm} from '../index';
import {RescheduleEventComponent} from '../forms/rescheduleEventForm';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import eventsUi from '../../../actions/events/ui';

describe('RescheduleEventForm', () => {
    let wrapper;

    beforeEach(() => {
        sinon.stub(eventsUi, 'rescheduleEvent').callsFake(() => () => Promise.resolve({}));
    });

    afterEach(() => {
        restoreSinonStub(eventsUi.rescheduleEvent);
        wrapper.unmount();
    });

    it('does not call onCloseModal after a reschedule, as rescheduleEvent reopens the editor', (done) => {
        const astore = getTestActionStore();

        astore.init();

        const onCloseModal = sinon.spy();

        wrapper = mount(
            <Provider store={createTestStore({initialState: astore.initialState})}>
                <RescheduleEventForm
                    original={astore.data.events[1]}
                    enableSaveInModal={() => true}
                    disableSaveInModal={() => true}
                    modalProps={{onCloseModal}}
                />
            </Provider>
        );

        wrapper.find(RescheduleEventComponent).instance()
            .submit()
            .then(() => {
                expect(eventsUi.rescheduleEvent.callCount).toBe(1);
                expect(onCloseModal.callCount).toBe(0);
                done();
            })
            .catch(done.fail);
    });
});

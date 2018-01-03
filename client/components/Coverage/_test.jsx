import {createTestStore} from '../../utils';
import {getTestActionStore} from '../../utils/testUtils';
import {mount} from 'enzyme';
import {Coverage} from '../index';
import React from 'react';
import {Provider} from 'react-redux';
import {reduxForm} from 'redux-form';
import {get} from 'lodash';

xdescribe('<CoverageForm />', () => {
    let store;
    let astore;
    let data;
    let services;
    let coverage;
    let planning;
    let readOnly;

    const CoverageForm = () => <Coverage
        coverage={'coverages[0]'}
        coverageId={coverage.coverage_id}
        hasAssignment={!!get(coverage, 'assigned_to.desk')}
        readOnly={readOnly}
    />;

    const getWrapper = () => {
        const FormComponent = reduxForm({form: 'planning'})(CoverageForm);

        return mount(
            <Provider store={store}>
                <FormComponent initialValues={planning}/>
            </Provider>
        );
    };

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;
        store = undefined;
        readOnly = false;

        planning = data.plannings[0];
        coverage = planning.coverages[0];
    });

    const setStore = () => {
        astore.init();

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                notify: services.notify,
            },
        });
        store.getState().forms.profiles = {coverage: {editor: {ednote: {enabled: true}}}};
    };

    describe('Coverage', () => {
        it('shows enabled fields', () => {
            setStore();
            const wrapper = getWrapper();

            expect(wrapper.find('.sd-line-input__label').first()
                .text()).toBe('Ed Note');
            expect(wrapper.find('.sd-line-input__input').length).toBe(1);
        });

        it('hides disabled fields', () => {
            setStore();
            store.getState().forms.profiles.coverage.editor.ednote.enabled = false;
            const wrapper = getWrapper();

            expect(wrapper.find('.sd-line-input__input').length).toBe(0);
        });

        it('enables fields if assignment is not in use', () => {
            setStore();
            store.getState().forms.profiles.coverage.editor = {
                slugline: {enabled: true},
                ednote: {enabled: true},
                keyword: {enabled: true},
                internal_note: {enabled: true},
                g2_content_type: {enabled: true},
                genre: {enabled: true},
                news_coverage_status: {enabled: true},
                scheduled: {enabled: true},
            };

            const expectReadOnly = (values) => {
                expect(wrapper.find('Field').at(1)
                    .props().readOnly).toBe(values.slugline);
                expect(wrapper.find('Field').at(2)
                    .props().readOnly).toBe(values.ednote);
                expect(wrapper.find('Field').at(3)
                    .props().readOnly).toBe(values.keyword);
                expect(wrapper.find('Field').at(4)
                    .props().readOnly).toBe(values.internal_note);
                expect(wrapper.find('Field').at(5)
                    .props().readOnly).toBe(values.g2_content_type);
                expect(wrapper.find('Field').at(6)
                    .props().readOnly).toBe(values.genre);
                expect(wrapper.find('Field').at(7)
                    .props().readOnly).toBe(values.news_coverage_status);
                expect(wrapper.find('Field').at(8)
                    .props().readOnly).toBe(values.scheduled);
            };

            coverage.assigned_to.state = 'assigned';
            let wrapper = getWrapper();

            expectReadOnly({
                slugline: false,
                ednote: false,
                keyword: false,
                internal_note: false,
                g2_content_type: true,
                genre: false,
                news_coverage_status: true,
                scheduled: false,
            });

            coverage.assigned_to.state = 'in_progress';
            wrapper = getWrapper();
            expectReadOnly({
                slugline: false,
                ednote: true,
                keyword: true,
                internal_note: false,
                g2_content_type: true,
                genre: true,
                news_coverage_status: true,
                scheduled: false,
            });

            coverage.assigned_to.state = 'submitted';
            wrapper = getWrapper();
            expectReadOnly({
                slugline: false,
                ednote: true,
                keyword: true,
                internal_note: false,
                g2_content_type: true,
                genre: true,
                news_coverage_status: true,
                scheduled: false,
            });

            coverage.assigned_to.state = 'completed';
            wrapper = getWrapper();
            expectReadOnly({
                slugline: false,
                ednote: false,
                keyword: false,
                internal_note: false,
                g2_content_type: true,
                genre: true,
                news_coverage_status: true,
                scheduled: false,
            });

            coverage.assigned_to.state = 'cancelled';
            wrapper = getWrapper();
            expectReadOnly({
                slugline: true,
                ednote: true,
                keyword: true,
                internal_note: true,
                g2_content_type: true,
                genre: true,
                news_coverage_status: true,
                scheduled: true,
            });

            delete coverage.assigned_to;
            wrapper = getWrapper();
            expectReadOnly({
                slugline: false,
                ednote: false,
                keyword: false,
                internal_note: false,
                g2_content_type: false,
                genre: false,
                news_coverage_status: false,
                scheduled: false,
            });

            readOnly = true;
            wrapper = getWrapper();
            expectReadOnly({
                slugline: true,
                ednote: true,
                keyword: true,
                internal_note: true,
                g2_content_type: true,
                genre: true,
                news_coverage_status: true,
                scheduled: true,
            });
        });
    });
});

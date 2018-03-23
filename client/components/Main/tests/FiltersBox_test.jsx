import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {cloneDeep} from 'lodash';

import {FiltersBox} from '../FiltersBox';

import * as helpers from '../../tests/helpers';
import {MAIN, AGENDA} from '../../../constants';
import {agendas as testAgendas} from '../../../utils/testData';

describe('components.Main.FiltersBox', () => {
    let activeFilter;
    let setFilter;
    let agendas;
    let enabledAgendas;
    let disabledAgendas;
    let selectAgenda;
    let currentAgendaId;
    let wrapper;

    beforeEach(() => {
        activeFilter = MAIN.FILTERS.COMBINED;
        setFilter = sinon.spy((filterType) => {
            activeFilter = filterType;
            wrapper.setProps({activeFilter});
        });
        agendas = cloneDeep(testAgendas);
        enabledAgendas = agendas.filter((a) => a.is_enabled);
        disabledAgendas = agendas.filter((a) => !a.is_enabled);
        selectAgenda = sinon.spy((agendaId) => {
            currentAgendaId = agendaId;
            wrapper.setProps({currentAgendaId});
        });
        currentAgendaId = AGENDA.FILTER.ALL_PLANNING;
    });

    const getWrapper = () => (
        mount(<FiltersBox
            activeFilter={activeFilter}
            setFilter={setFilter}
            enabledAgendas={enabledAgendas}
            disabledAgendas={disabledAgendas}
            selectAgenda={selectAgenda}
            currentAgendaId={currentAgendaId}
        />)
    );

    it('renders the checkboxes', () => {
        wrapper = getWrapper();
        const filters = new helpers.main.FiltersBox(wrapper);

        expect(filters.isMounted).toBe(true);

        expect(filters.combined.isMounted).toBe(true);
        expect(filters.combined.label()).toBe('Events & Planning');
        expect(filters.combined.checked()).toBe(true);

        expect(filters.events.isMounted).toBe(true);
        expect(filters.events.label()).toBe('Events only');
        expect(filters.events.checked()).toBe(false);

        expect(filters.planning.isMounted).toBe(true);
        expect(filters.planning.label()).toBe('Planning only');
        expect(filters.planning.checked()).toBe(false);

        expect(filters.activeFilter()).toBe(MAIN.FILTERS.COMBINED);
        expect(filters.currentAgendaId()).toBe(AGENDA.FILTER.ALL_PLANNING);
    });

    it('executes `setFilter` on clicking checkboxes', () => {
        wrapper = getWrapper();
        const filters = new helpers.main.FiltersBox(wrapper);

        filters.events.click();
        expect(setFilter.callCount).toBe(1);
        expect(setFilter.args[0]).toEqual([MAIN.FILTERS.EVENTS]);

        filters.planning.click();
        expect(setFilter.callCount).toBe(2);
        expect(setFilter.args[1]).toEqual([MAIN.FILTERS.PLANNING]);

        filters.combined.click();
        expect(setFilter.callCount).toBe(3);
        expect(setFilter.args[2]).toEqual([MAIN.FILTERS.COMBINED]);
    });

    // TODO: To be revisited
    xit('only renders Spacer and Agenda dropdown in Planning only view', () => {
        wrapper = getWrapper();
        const filters = new helpers.main.FiltersBox(wrapper);

        expect(filters.spacer.exists()).toBe(false);
        expect(filters.agendaDropdown.isMounted).toBe(false);

        filters.events.click();
        filters.update();
        expect(filters.spacer.exists()).toBe(false);
        expect(filters.agendaDropdown.isMounted).toBe(false);

        filters.planning.click();
        filters.update();
        expect(filters.spacer.exists()).toBe(true);
        expect(filters.agendaDropdown.isMounted).toBe(true);
    });

    // TODO: To be revisited
    xit('Agenda dropdown functionality', () => {
        wrapper = getWrapper();
        const filters = new helpers.main.FiltersBox(wrapper);

        filters.planning.click();
        filters.update();

        expect(filters.currentAgendaId()).toBe(AGENDA.FILTER.ALL_PLANNING);
        expect(filters.agendaDropdown.isMounted).toBe(true);
        expect(filters.agendaDropdown.buttonLabel()).toBe('Agenda: All Planning');

        expect(filters.agendaDropdown.items()).toEqual([
            jasmine.objectContaining({
                label: 'TestAgenda',
                id: 'a1'
            }),
            jasmine.objectContaining({
                label: 'TestAgenda2',
                id: 'a2'
            }),
            jasmine.objectContaining({divider: true}),
            jasmine.objectContaining({
                label: 'TestAgenda3',
                id: 'a3'
            }),
            jasmine.objectContaining({divider: true}),
            jasmine.objectContaining({label: 'No Agenda Assigned'}),
            jasmine.objectContaining({label: 'All Planning Items'}),
        ]);

        filters.agendaDropdown.item(1).action();
        expect(selectAgenda.callCount).toBe(1);
        expect(selectAgenda.args[0]).toEqual(['a2']);

        expect(filters.currentAgendaId()).toBe('a2');
        expect(filters.agendaDropdown.buttonLabel()).toBe('Agenda: TestAgenda2');
    });
});

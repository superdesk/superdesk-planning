import React from 'react'
import { shallow } from 'enzyme'
import { AssignmentPanel } from './'
import { AssignmentPreviewContainer } from '../'
import * as helpers from '../tests/helpers'
import sinon from 'sinon'

describe('<AssignmentPanelContainer />', () => {
    let closePanel
    let onFulFilAssignment
    let previewOpened

    beforeEach(() => {
        onFulFilAssignment = sinon.spy()
        closePanel = sinon.spy()
        previewOpened = true
    })

    const getShallowWrapper = () => shallow(
        <AssignmentPanel
            closePanel={closePanel}
            onFulFilAssignment={onFulFilAssignment}
            previewOpened={previewOpened}
        />
    )

    it('opening and closing the assignment panel', () => {
        // Start out showing the panel
        let wrapper
        closePanel = sinon.spy(() => wrapper.setProps({ previewOpened: false }))
        wrapper = getShallowWrapper()
        let tabs = new helpers.tabs(wrapper)
        expect(wrapper.hasClass('sd-preview-panel content-item-preview AssignmentPanelContainer')).toBe(true)

        // Tabs are available
        expect(tabs.isMounted).toBe(true)
        expect(tabs.labels()).toEqual(['Assignment'])

        // Default tab is Assignment
        expect(tabs.getActiveTab()).toEqual('Assignment')
        expect(wrapper.find(AssignmentPreviewContainer).length).toBe(1)

        tabs.setActiveTab('Test Tab')
        expect(wrapper.find(AssignmentPreviewContainer).length).toBe(0)

        // Now close the panel
        wrapper.find('.side-panel__tools').simulate('click')
        expect(closePanel.callCount).toBe(1)
        expect(wrapper.instance().props.previewOpened).toBe(false)

        tabs = new helpers.tabs(wrapper)
        expect(tabs.isMounted).toBe(false)

        expect(wrapper.contains(
            <div className="sd-preview-panel content-item-preview hidden" />
        )).toBe(true)
        expect(wrapper.find(AssignmentPreviewContainer).length).toBe(0)
    })
})

import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../superdeskApi';
import {ILocation} from '../../interfaces';
import {KEYCODES} from '../../constants';

import {uiUtils, onEventCapture} from '../../utils';

import {Button, TabNav, TabItem, TabContent, TabPanel} from 'superdesk-ui-framework/react';
import {Popup, Content} from '../UI/Popup';
import {LocationLookupResultItem} from './LocationLookupResultItem';

import './style.scss';

interface IProps {
    suggests?: Array<Partial<ILocation>>;
    localSuggests?: Array<ILocation>;
    showExternalSearch?: boolean;
    showAddLocation?: boolean;
    target: string;
    searching?: boolean;
    onChange(location: Partial<ILocation>): void;
    onCancel(): void;
    handleSearchClick(): void;
    onLocalSearchOnly(): void;
    onAddNewLocation(): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface IState {
    activeOptionIndex: number;
    activeTabId: 'internal' | 'external';
}

export class AddGeoLookupResultsPopUp extends React.Component<IProps, IState> {
    dom: {
        itemList: React.RefObject<HTMLUListElement>;
    };

    constructor(props) {
        super(props);

        this.state = {
            activeOptionIndex: -1,
            activeTabId: 'internal',
        };

        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);
        this.onTabChange = this.onTabChange.bind(this);

        this.dom = {itemList: React.createRef<HTMLUListElement>()};
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey();
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey();
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey();
                break;
            }
        }
    }

    handleEnterKey() {
        if (this.state.activeOptionIndex > -1) {
            if (this.state.activeOptionIndex < get(this.props.localSuggests, 'length', -1)) {
                this.props.onChange(this.props.localSuggests[this.state.activeOptionIndex]);
                return;
            }

            if (this.state.activeOptionIndex === get(this.props.localSuggests, 'length', 0)) {
                this.onSearch();
                return;
            }

            if (this.state.activeOptionIndex >= get(this.props.localSuggests, 'length', 0) + 1) {
                this.props.onChange(this.props.suggests[
                    this.state.activeOptionIndex - (get(this.props.localSuggests, 'length', 0) + 1)]);
            }
        }
    }

    handleDownArrowKey() {
        if (this.state.activeOptionIndex <
            (1 + // External search button
            get(this.props.localSuggests, 'length', 0) +
            get(this.props.suggests, 'length', 0)) - 1
        ) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});

            if (this.dom.itemList.current != null) {
                uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.itemList.current);
            }
        }
    }

    handleUpArrowKey() {
        if (this.state.activeOptionIndex > 0) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});

            if (this.dom.itemList.current != null) {
                uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.itemList.current);
            }
        }
    }

    onSearch() {
        this.props.handleSearchClick();
    }

    onTabChange(tabId: IState['activeTabId']) {
        if (tabId !== this.state.activeTabId) {
            this.setState({
                activeTabId: tabId,
            });

            if (this.state.activeTabId === 'internal') {
                this.onSearch();
            } else {
                this.props.onLocalSearchOnly();
            }
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const localSuggests = get(this.props.localSuggests, 'length') > 0 ?
            this.props.localSuggests : [];
        const suggests = get(this.props.suggests, 'length') > 0 ?
            this.props.suggests : [];
        const tabLabels = [(
            <TabItem key="internal" id="internal">
                {gettext('Existing Locations')}
            </TabItem>
        )];

        if (this.props.showExternalSearch) {
            tabLabels.push((
                <TabItem key="external" id="external">
                    {gettext('Search OpenStreetMap')}
                </TabItem>
            ));
        }

        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.handleKeyBoardEvent}
                noPadding={true}
                inheritWidth={true}
                className="addgeolookup__popup"
                ignoreOnClickElement="location"
                onPopupOpen={this.props.onPopupOpen}
                onPopupClose={this.props.onPopupClose}
            >
                <Content
                    noPadding={true}
                    className="addgeolookup__suggests-wrapper"
                >
                    <TabNav
                        onClick={this.onTabChange}
                        activePanel={this.state.activeTabId}
                        size="small"
                    >
                        {tabLabels}
                    </TabNav>
                    <TabContent activePanel={this.state.activeTabId}>
                        <TabPanel id="internal">
                            <ul
                                className="addgeolookup__suggests"
                                ref={this.dom.itemList}
                            >
                                {localSuggests.map((suggest, index) => (
                                    <LocationLookupResultItem
                                        key={index}
                                        location={suggest}
                                        onClick={this.props.onChange.bind(null, suggest)}
                                        active={index === this.state.activeOptionIndex}
                                    />
                                ))}
                                {get(localSuggests, 'length') === 0 && (
                                    <li className="addgeolookup__item">
                                        {gettext('No results found')}
                                    </li>
                                )}
                            </ul>
                        </TabPanel>
                        <TabPanel id="external">
                            {this.props.searching ? (
                                <div className="spinner-big" />
                            ) : (
                                <ul
                                    className="addgeolookup__suggests"
                                    ref={this.dom.itemList}
                                >
                                    {suggests.map((suggest, index) => (
                                        <LocationLookupResultItem
                                            key={index}
                                            location={suggest}
                                            onClick={this.props.onChange.bind(null, suggest)}
                                            active={(
                                                index +
                                                get(this.props.localSuggests, 'length', 0) +
                                                1
                                            ) === this.state.activeOptionIndex}
                                        />
                                    ))}
                                    {get(suggests, 'length') === 0 && (
                                        <li className="addgeolookup__item">
                                            {gettext('No results found')}
                                        </li>
                                    )}
                                </ul>
                            )}
                        </TabPanel>
                    </TabContent>
                    {this.props.showAddLocation && (
                        <Button
                            text={gettext('Add a new location')}
                            data-test-id="location-search__create-new"
                            disabled={this.props.searching}
                            onClick={this.props.onAddNewLocation}
                            expand={true}
                        />
                    )}
                </Content>
            </Popup>
        );
    }
}

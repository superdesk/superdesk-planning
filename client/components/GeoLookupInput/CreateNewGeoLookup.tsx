import * as React from 'react';
import {connect} from 'react-redux';
import {set, cloneDeep} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IVocabularyItem} from 'superdesk-api';
import {ILocation} from '../../interfaces';
import {superdeskApi, planningApi} from '../../superdeskApi';

import * as selectors from '../../selectors';

import {formatLocationToAddress} from '../../utils/locations';

import {ButtonGroup, Button} from 'superdesk-ui-framework/react';
import {EditorFieldText} from '../fields/editor/base/text';
import Modal from '../Modal';
import ModalDialog from '../Modal/ModalDialog';
import {renderFieldsForPanel} from '../fields';

import './style.scss';

interface IProps {
    initialName?: string;
    initialAddressIsName?: boolean;

    // Redux states
    defaultCountry?: IVocabularyItem['name'];

    // functions to close the popup (and resolve/reject the Promise)
    resolve(location: ILocation): void;
    reject(error?: any): void;
}

interface IState {
    formInvalid: boolean;
    item: {
        location: Partial<ILocation>;
        state?: IVocabularyItem | string;
        country?: IVocabularyItem | string;
    };
}

const mapStateToProps = (state) => ({
    defaultCountry: selectors.general.preferredCountry(state),
});

class CreateNewGeoLookupComponent extends React.Component<IProps, IState> {
    dom: {
        name: React.RefObject<EditorFieldText>;
    };

    constructor(props) {
        super(props);
        this.state = {
            formInvalid: true,
            item: {
                location: {
                    name: this.props.initialName,
                    address: {
                        line: [
                            this.props.initialAddressIsName ?
                                this.props.initialName :
                                ''
                        ],
                        country: this.props.defaultCountry ?? '',
                    },
                },
            },
        };
        this.dom = {name: React.createRef()};

        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    componentDidMount() {
        if (this.dom.name.current != null) {
            this.dom.name.current.focus();
        }
    }

    getLocationFromState(item: IState['item']): Partial<ILocation> {
        const location = cloneDeep(item.location);
        const formattedAddress = formatLocationToAddress(location);

        location.unique_name = location.name.concat(' ', formattedAddress);
        location.address.state = typeof item.state === 'string' ?
            item.state :
            item.state?.name;
        location.address.country = typeof item.country === 'string' ?
            item.country :
            item.country?.name;

        return location;
    }

    onChange(field: string, value: string) {
        const item: IState['item'] = cloneDeep(this.state.item);

        set(item, field, value);

        this.setState({
            formInvalid: !item.location.name?.length ||
                !item.location.address.line?.[0]?.length ||
                !item.location.address.city?.length ||
                !item.country,
            item: item,
        });
    }

    onSave() {
        planningApi.locations.getOrCreate(this.getLocationFromState(this.state.item))
            .then((newLocation) => {
                this.props.resolve(newLocation);
            }, (error) => {
                this.props.reject(error);
            });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const item = this.state.item;

        return (
            <ModalDialog className="modal">
                <Modal.Header>
                    <h3 className="modal__heading">
                        {gettext('Add New Event Location')}
                    </h3>
                    <a
                        className="icn-btn"
                        aria-label={gettext('Close')}
                        onClick={this.props.reject}
                    >
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body>
                    {renderFieldsForPanel(
                        'editor',
                        {
                            'location.name': {enabled: true, index: 1},
                            'location.address': {enabled: true, index: 2},
                            'location.area': {enabled: true, index: 3},
                            'location.suburb': {enabled: true, index: 4},
                            'location.city': {enabled: true, index: 5},
                            'location.locality': {enabled: true, index: 6},
                            'location.region': {enabled: true, index: 7},
                            'location.postal_code': {enabled: true, index: 8},
                            'location.country': {enabled: true, index: 9},
                            'location.notes': {enabled: true, index: 10},
                        },
                        {
                            item: item,
                            onChange: this.onChange,
                            language: getUserInterfaceLanguage(),
                        },
                        {
                            'location.name': {required: true},
                            'location.address': {required: true},
                            'location.city': {required: true},
                            'location.region': {clearable: true},
                            'location.country': {required: true, clearable: true},
                        },
                        null,
                        null,
                        'enabled',
                        {'location.name': this.dom.name}
                    )}
                </Modal.Body>
                <Modal.Footer flex={true}>
                    <ButtonGroup align="right">
                        <Button
                            text={gettext('Cancel')}
                            onClick={this.props.reject}
                            data-test-id="location-form__cancel-button"
                        />
                        <Button
                            text={gettext('Create Location')}
                            onClick={this.onSave}
                            type="primary"
                            disabled={this.state.formInvalid}
                            data-test-id="location-form__create-button"
                        />
                    </ButtonGroup>
                </Modal.Footer>
            </ModalDialog>
        );
    }
}

export const CreateNewGeoLookup = connect(mapStateToProps)(CreateNewGeoLookupComponent);

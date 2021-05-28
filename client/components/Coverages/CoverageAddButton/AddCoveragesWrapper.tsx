import * as React from 'react';
import {connect} from 'react-redux';
import {isEqual} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IDesk, IUser} from 'superdesk-api';
import {IG2ContentType, IPlanningCoverageItem, IPlanningNewsCoverageStatus} from '../../../interfaces';

import {planningUtils, onEventCapture} from '../../../utils';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {CoveragesMenuPopup} from './CoveragesMenuPopup';
import {CoverageAddAdvancedModal} from '../CoverageAddAdvancedModal';

interface IProps {
    field: string;
    value: Array<DeepPartial<IPlanningCoverageItem>>;
    target: string;
    button: React.ComponentType<{toggleMenu: (event: React.MouseEvent<HTMLButtonElement>) => void}>;

    onChange(field: string, value: Array<DeepPartial<IPlanningCoverageItem>>): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<IPlanningCoverageItem>;
    setCoverageAddAdvancedMode(enable: boolean): void;
    onOpen?(): void;
    onAdd(
        qcode: IG2ContentType['qcode'],
        defaultDesk?: IDesk,
        preferredCoverageDesks?: {[key: string]: IDesk['_id']}
    ): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;

    contentTypes: Array<IG2ContentType>;
    defaultDesk?: IDesk;
    preferredCoverageDesks: {[key: string]: string};
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    desks: Array<IDesk>;
    users: Array<IUser>;
    coverageAddAdvancedMode: boolean;
}

interface ICoverageTypeEntry {
    id: string;
    qcode: string;
    label: string;
    icon: string;
    callback(): void;
}

interface IState {
    isOpen: boolean;
    advanced: boolean;
    coverageTypes: Array<ICoverageTypeEntry>;
}

const mapStateToProps = (state) => ({
    contentTypes: selectors.general.contentTypes(state),
    defaultDesk: selectors.general.defaultDesk(state),
    preferredCoverageDesks: selectors.general.preferredCoverageDesks(state)?.desks ?? {},
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    coverageAddAdvancedMode: selectors.general.coverageAddAdvancedMode(state),
});

const mapDispatchToProps = (dispatch) => ({
    setCoverageAddAdvancedMode: (advancedMode) => dispatch(actions.users.setCoverageAddAdvancedMode(advancedMode)),
});

function getCoverageTypesFromProps(props: IProps): Array<ICoverageTypeEntry> {
    const language = getUserInterfaceLanguage();

    return props.contentTypes.map((type) => ({
        id: `coverage-menu-add-${type.qcode}`,
        qcode: type.qcode,
        label: getVocabularyItemFieldTranslated(
            type,
            'name',
            language
        ),
        icon: planningUtils.getCoverageIcon(type['content item type'] || type.qcode),
        callback: props.onAdd.bind(
            null,
            type.qcode,
            props.defaultDesk,
            props.preferredCoverageDesks
        )
    }));
}

class AddCoveragesWrapperComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            advanced: false,
            coverageTypes: getCoverageTypesFromProps(this.props),
        };

        this.closeMenu = this.closeMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
        this.openAdvanced = this.openAdvanced.bind(this);
        this.closeAdvanced = this.closeAdvanced.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
    }

    static getDerivedStateFromProps(props: IProps, state: IState) {
        const prevQcodes = state.coverageTypes.map((type) => type.qcode);
        const currentQcodes = props.contentTypes.map((type) => type.qcode);

        if (!isEqual(prevQcodes, currentQcodes)) {
            return {
                coverageTypes: getCoverageTypesFromProps(props),
            };
        }

        return null;
    }

    closeMenu(event: React.MouseEvent) {
        onEventCapture(event);
        this.setState({isOpen: false});
    }

    openMenu(event: React.MouseEvent) {
        if (this.props.coverageAddAdvancedMode) {
            this.openAdvanced(event);
        } else {
            onEventCapture(event);
            this.setState({isOpen: true});

            if (this.props.onOpen != null) {
                this.props.onOpen();
            }
        }
    }

    openAdvanced(event: React.MouseEvent) {
        onEventCapture(event);
        this.setState({
            isOpen: false,
            advanced: true,
        });
    }

    closeAdvanced(event?: React.MouseEvent) {
        if (event != null) {
            onEventCapture(event);
        }
        this.setState({advanced: false});
    }

    toggleMenu(event: React.MouseEvent) {
        this.state.isOpen ?
            this.closeMenu(event) :
            this.openMenu(event);
    }

    render() {
        const Button = this.props.button;

        return (
            <React.Fragment>
                <Button toggleMenu={this.toggleMenu} />
                {!this.state.isOpen ? null : (
                    <CoveragesMenuPopup
                        closeMenu={this.closeMenu}
                        actions={this.state.coverageTypes}
                        target={this.props.target}
                        onPopupOpen={this.props.onPopupOpen}
                        onPopupClose={this.props.onPopupClose}
                        openAdvanced={this.openAdvanced}
                    />
                )}
                {!this.state.advanced ? null : (
                    <CoverageAddAdvancedModal
                        close={this.closeAdvanced}
                        contentTypes={this.props.contentTypes}
                        newsCoverageStatus={this.props.newsCoverageStatus}

                        field={this.props.field}
                        value={this.props.value}
                        onChange={this.props.onChange}
                        createCoverage={this.props.createCoverage}

                        users={this.props.users}
                        desks={this.props.desks}

                        coverageAddAdvancedMode={this.props.coverageAddAdvancedMode}
                        setCoverageAddAdvancedMode={this.props.setCoverageAddAdvancedMode}
                    />
                )}
            </React.Fragment>
        );
    }
}

export const AddCoveragesWrapper = connect(
    mapStateToProps,
    mapDispatchToProps
)(AddCoveragesWrapperComponent);

import * as React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';

import {EDITOR_TYPE, IBookmarkProps, IG2ContentType, IPlanningCoverageItem, IPlanningItem} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

import {Icon, Button} from 'superdesk-ui-framework/react';
import {AddCoveragesWrapper} from '../../Coverages/CoverageAddButton/AddCoveragesWrapper';

interface IProps extends IBookmarkProps {
    item?: DeepPartial<IPlanningItem>;
}

export class AddCoverageBookmark extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.createCoverage = this.createCoverage.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    createCoverage(qcode: IG2ContentType['qcode']) {
        return planningApi.planning.coverages.setDefaultValues(this.props.item, null, qcode);
    }

    onAdd(qcode: IG2ContentType['qcode']) {
        planningApi.editor(this.props.editorType).item.planning.addCoverages([
            planningApi.planning.coverages.setDefaultValues(
                this.props.item,
                null,
                qcode
            )
        ]);
    }

    onChange(field: string, coverages: Array<DeepPartial<IPlanningCoverageItem>>) {
        planningApi.editor(this.props.editorType).item.planning.addCoverages(coverages);
    }

    renderForPanel() {
        const {gettext} = superdeskApi.localization;

        return (
            <AddCoveragesWrapper
                field={'coverages'}
                value={this.props.item?.coverages ?? []}
                onChange={this.onChange}
                createCoverage={this.createCoverage}
                onAdd={this.onAdd}
                target="icon-plus-sign"
                language={this.props.item.language}
                button={({toggleMenu}) => (
                    <OverlayTrigger
                        placement="right"
                        overlay={(
                            <Tooltip id="coverage_links">
                                {gettext('Add Coverage')}
                            </Tooltip>
                        )}
                    >
                        <button
                            data-test-id={`editor--bookmarks__${this.props.bookmark.id}`}
                            type="button"
                            className={classNames(
                                'sd-navbtn sd-navbtn--default',
                                'editor-bookmark',
                                {active: this.props.active}
                            )}
                            tabIndex={0}
                            aria-label={this.props.bookmark.id}
                            onClick={toggleMenu}
                        >
                            <Icon name="plus-sign" />
                        </button>
                    </OverlayTrigger>
                )}
            />
        );
    }

    renderForPopup() {
        const {gettext} = superdeskApi.localization;

        return (
            <AddCoveragesWrapper
                field={'coverages'}
                value={this.props.item?.coverages ?? []}
                onChange={this.onChange}
                createCoverage={this.createCoverage}
                onAdd={this.onAdd}
                target="icon-plus-sign"
                button={({toggleMenu}) => (
                    <Button
                        text={gettext('Add Coverage')}
                        style="hollow"
                        type="primary"
                        icon="plus-sign"
                        size="large"
                        expand={true}
                        onClick={toggleMenu}
                        data-test-id={`editor--bookmarks__${this.props.bookmark.id}`}
                    />
                )}
            />
        );
    }

    render() {
        if (this.props.readOnly) {
            return null;
        }

        return this.props.editorType === EDITOR_TYPE.POPUP ?
            this.renderForPopup() :
            this.renderForPanel();
    }
}

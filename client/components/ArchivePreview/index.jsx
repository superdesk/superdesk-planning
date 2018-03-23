import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, map} from 'lodash';
import classNames from 'classnames';

import {AuditInformation, HtmlPreview, StateLabel, ItemRendition, PriorityLabel, UrgencyLabel} from '../';
import {getCreator} from '../../utils';
import * as actions from '../../actions';
import * as selectors from '../../selectors';

import './style.scss';

class ArchivePreviewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {headerOpen: true};
        this.toggleHeader = this.toggleHeader.bind(this);
    }

    componentDidMount() {
        // When mounting this component, if the Assignment item is set
        // then load the associated Archive item now
        const {assignment, loadArchiveItem} = this.props;

        if (get(assignment, '_id', null) !== null) {
            loadArchiveItem(assignment);
        }
    }

    componentWillReceiveProps(nextProps) {
        // If the Assignment item has changed, then load the associated Archive item
        const nextId = get(nextProps, 'assignment._id', null);
        const currentId = get(this.props, 'assignment._id', null);

        if (nextId !== currentId) {
            this.props.loadArchiveItem(nextProps.assignment);
        }
    }

    toggleHeader() {
        this.setState({headerOpen: !this.state.headerOpen});
    }

    render() {
        const {archive, users, priorities, urgencies, urgencyLabel} = this.props;

        if (archive === null) {
            return null;
        }

        const createdBy = getCreator(archive, 'original_creator', users);
        const updatedBy = getCreator(archive, 'version_creator', users);
        const creationDate = get(archive, '_created');
        const updatedDate = get(archive, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);
        const archiveType = get(archive, 'type', 'text');

        return (
            <div className="ArchivePreview content">
                <div className="ArchivePreview__audit side-panel__content-block side-panel__content-block--pad-small">
                    <div className="side-panel__content-block-inner">
                        <AuditInformation
                            createdBy={createdBy}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate}
                        />
                    </div>
                </div>

                <div className={classNames(
                    'ArchivePreview__header',
                    'side-panel__content-block',
                    'side-panel__content-block--pad-small',
                    'side-panel__content-block--flex',
                    {active: this.state.headerOpen}
                )}>
                    {this.state.headerOpen &&
                        <div className="ArchivePreview__header-left side-panel__content-block-inner">
                            <div>
                                <span
                                    data-sd-tooltip={`Article Type: ${archive.type}`}
                                    data-flow="right"
                                >
                                    <i className={`coverage-icon icon-${archive.type}`} />
                                </span>
                            </div>

                            {get(archive, 'priority') &&
                                <div>
                                    <PriorityLabel
                                        item={archive}
                                        priorities={priorities}
                                    />
                                </div>
                            }

                            {get(archive, 'urgency') &&
                                <div>
                                    <UrgencyLabel
                                        item={archive}
                                        urgencies={urgencies}
                                        label={urgencyLabel}
                                    />
                                </div>
                            }

                        </div>}

                    {this.state.headerOpen &&
                        <div className="ArchivePreview__header-middle side-panel__content-block-inner
                        side-panel__content-block-inner--grow">
                            {get(archive, 'slugline') &&
                                <HtmlPreview className="sd-text__slugline" html={archive.slugline}/>
                            }

                            {get(archive, 'anpa_take_key') &&
                                <div>
                                    <span className="metaLabel">takekey: </span>
                                    <span>{archive.anpa_take_key}</span>
                                </div>
                            }
                            {get(archive, 'ednote') &&
                                <div>
                                    <span className="metaLabel">EdNote: </span>
                                    <span className="sd-text__ednote">{archive.ednote}</span>
                                </div>
                            }
                            {get(archive, 'company_codes.length', 0) > 0 &&
                                <div>
                                    <span className="metaLabel">Company Codes: </span>
                                    <span>{map(archive.company_codes, 'qcode').join(', ')}</span>
                                </div>
                            }

                            <div>
                                <StateLabel
                                    item={archive}
                                    withPubStatus={false}
                                />
                                {get(archive, 'embargo') &&
                                    <span className="state-label state_embargo">Embargo</span>
                                }
                                {get(archive, 'flags.marked_for_not_publication') &&
                                    <span className="state-label not-for-publication">Not for Publication</span>
                                }
                                {get(archive, 'flags.marked_for_legal') &&
                                    <span className="state-label legal">Legal</span>
                                }
                                {get(archive, 'flags.marked_for_sms') &&
                                    <span className="state-label sms">Sms</span>
                                }
                                {get(archive, 'rewritten_by') &&
                                    <span className="state-label updated">Updated</span>
                                }
                            </div>

                            {get(archive, '_type') !== 'archived' &&
                                <div>
                                    <span><b>{get(archive, '_deskName')}</b> / {get(archive, '_stageName')}</span>
                                </div>
                            }
                        </div>}

                    {this.state.headerOpen &&
                        <div className="ArchivePreview__header-right side-panel__content-block-inner
                        side-panel__content-block-inner--right">
                            {archiveType === 'text' &&
                                <div>
                                    <span className="word-count">
                                        <b>{get(archive, 'word_count', 0)}</b> <span>words</span>
                                    </span>
                                </div>
                            }

                            {get(archive, 'source') &&
                                <div>
                                    <span>{archive.source}</span>
                                </div>
                            }

                            {get(archive, 'highlights.length', 0) > 0 &&
                                <div>
                                    <i className={archive.highlights.length > 1 ? 'icon-multi-star' : 'icon-start'} />
                                </div>
                            }

                            {get(archive, 'marked_desks.length', 0) > 0 &&
                                <div>
                                    <i className="icon-bell" />
                                </div>
                            }
                        </div>
                    }

                    <button className={classNames(
                        'preview-header__toggle',
                        {active: !this.state.headerOpen}
                    )}>
                        <i className="icon-chevron-up-thin" onClick={this.toggleHeader} />
                    </button>
                </div>

                <div className="ArchivePreview__content side-panel__content-block
                side-panel__content-block--pad-small">
                    {archiveType !== 'composite' && get(archive, 'headline') &&
                        <div>
                            <span className="headline">{archive.headline}</span>
                        </div>
                    }

                    <div className="core-content">
                        {get(archive, 'associations.featuremedia') &&
                            <div>
                                <ItemRendition item={archive.associations.featuremedia} />
                                <p>{get(archive, 'associations.featuremedia.description_text')}</p>
                            </div>
                        }

                        {(archiveType === 'picture' || archiveType === 'graphic') &&
                            <div>
                                <span>Original</span>
                                <ItemRendition item={archive} />
                            </div>
                        }

                        {archiveType === 'audio' &&
                            <div>
                                <audio controls="controls">
                                    <source
                                        src={get(archive, 'renditions.original.href')}
                                        type={get(archive, 'renditions.original.mimetype')}
                                    />
                                </audio>
                            </div>
                        }

                        {archiveType === 'video' &&
                            <div>
                                <video controls="controls">
                                    <source
                                        src={get(archive, 'renditions.original.href')}
                                        type={get(archive, 'renditions.original.mimetype')}
                                    />
                                </video>
                            </div>
                        }

                        {get(archive, 'abstract') &&
                        <HtmlPreview className="text abstract" html={archive.abstract}/>}
                        {get(archive, 'byline') &&
                        <HtmlPreview className="text byline" html={archive.byline}/>}
                        {get(archive, 'dateline.text') &&
                        <HtmlPreview className="text dateline" html={archive.dateline.text}/>}
                        {get(archive, 'body_html') &&
                        <HtmlPreview className="text body-text" html={archive.body_html}/>}
                        {get(archive, 'body_footer') &&
                        <HtmlPreview className="text body-footer" html={archive.body_footer}/>}
                        {get(archive, 'sign_off') &&
                        <HtmlPreview className="text sign-off" html={archive.sign_off}/>}
                    </div>
                </div>
            </div>
        );
    }
}

ArchivePreviewComponent.propTypes = {
    archive: PropTypes.object,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    assignment: PropTypes.object,
    loadArchiveItem: PropTypes.func,
    priorities: PropTypes.array,
    urgencies: PropTypes.array,
    urgencyLabel: PropTypes.string,
};

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    archive: selectors.getCurrentAssignmentArchiveItem(state),
    users: selectors.getUsers(state),
    priorities: selectors.getArchivePriorities(state),
    urgencies: selectors.getUrgencies(state),
    urgencyLabel: selectors.vocabs.urgencyLabel(state),
});

const mapDispatchToProps = (dispatch) => (
    {loadArchiveItem: (assignment) => dispatch(actions.assignments.api.loadArchiveItem(assignment))}
);

export const ArchivePreview = connect(
    mapStateToProps,
    mapDispatchToProps
)(ArchivePreviewComponent);

import React from 'react';
import { gettext } from '../utils';

function FiltersPanel() {
    return (
        <div className="sd-filters-panel">
            <div className="side-panel side-panel--transparent side-panel--shadow-left">
                <div className="side-panel__header side-panel__header--border-b">
                    <h3 className="side-panel__heading">{gettext('Advanced filters')}</h3>
                </div>
            </div>
        </div>
    );
}

export default FiltersPanel;

# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class SyncItemData:
    original: Dict[str, Any]
    updates: Dict[str, Any]
    original_translations: Dict[str, Dict[str, str]]
    updated_translations: Dict[str, Dict[str, str]]


@dataclass
class SyncData:
    event: SyncItemData
    planning: SyncItemData
    coverage_updates: List[Dict[str, Any]]
    update_translations: bool
    update_coverages: bool
    update_planning: bool


@dataclass
class VocabsSyncData:
    coverage_states: Dict[str, Dict[str, str]]
    genres: Dict[str, Dict[str, str]]

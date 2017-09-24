# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import json
import os
import superdesk
import logging
from superdesk import get_resource_service


logger = logging.getLogger(__name__)


def populate_types(json_data):
    service = get_resource_service('planning_types')
    for item in json_data:
        id_name = item.get('_id')

        if service.find_one(_id=id_name, req=None):
            service.put(id_name, item)
        else:
            service.post([item])


def process_types(filepath):
    """This function upserts the types into the planning_types collection

    The format of the file used is JSON

    "param filepath: absolute filepath
    :return: nothing
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError

    with open(filepath, 'rt') as types:
        json_data = json.loads(types.read())
        populate_types(json_data)


class PopulatePlanningTypesCommand(superdesk.Command):
    """
    Class defining the populate types command
    """

    option_list = (
        superdesk.Option('--filepath', '-f', dest='filepath', required=True),
    )

    def run(self, filepath):
        process_types(filepath)


superdesk.command('planning:populate_types', PopulatePlanningTypesCommand())

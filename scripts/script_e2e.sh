#!/bin/bash -e

export TZ=Australia/Sydney

honcho start &
npm run cypress-ci

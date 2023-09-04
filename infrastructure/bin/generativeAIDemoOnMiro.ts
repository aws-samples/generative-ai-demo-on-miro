#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { DeployStack } from '../lib/generativeAIDemoOnMiroStack'
import * as appConfig from '../../deployment-config.json'

const app = new cdk.App()
new DeployStack(app, 'generativeAIDemoOnMiroStack', appConfig)

#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ECRStack } from '../lib/ecr-stack'

const app = new cdk.App()
new ECRStack(app, 'ECRStack', {})

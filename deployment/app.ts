import * as cdk from "@aws-cdk/core";
import { exit } from "process";
import { SpaStack } from "./spa-stack";

const stackName = process.env["STACK_NAME"];
if (!stackName) {
  console.error("missing environment variable STACK_NAME");
  exit(1);
}

const app = new cdk.App();
new SpaStack(app, stackName, {});

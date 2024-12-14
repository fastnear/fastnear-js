import { Buffer } from "buffer";
import process from "process";
import { api as near, convertUnit } from "./near";

window.Buffer = Buffer;
window.process = process;
window.near = near;
window.$$ = convertUnit;

export { near };

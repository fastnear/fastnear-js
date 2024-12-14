import { Buffer } from "buffer";
import { api as near, convertUnit } from "./near";

window.Buffer = Buffer;
window.near = near;
window.$$ = convertUnit;

export { near };

import { Buffer } from "buffer";
import process from "process";
import { api as near } from "./near";

window.Buffer = Buffer;
window.process = process;
window.near = near;

export { near };

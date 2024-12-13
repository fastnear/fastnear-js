import { Buffer } from 'buffer';
import process from 'process';
import { Near } from "./near";

window.Buffer = Buffer;
window.process = process;
window.Near = Near;

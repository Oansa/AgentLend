"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = getLogger;
const pino_1 = __importDefault(require("pino"));
const config_js_1 = require("../config.js");
let loggerInstance = null;
function getLogger() {
    if (!loggerInstance) {
        // Use defaults if config not loaded yet
        const logLevel = config_js_1.config.LOG_LEVEL || 'info';
        const logPretty = config_js_1.config.LOG_PRETTY !== false;
        // Don't use pino-pretty in test environment (it can fail)
        const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
        loggerInstance = (0, pino_1.default)({
            level: logLevel,
            transport: !isTest && logPretty ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            } : undefined,
        });
    }
    return loggerInstance;
}
//# sourceMappingURL=logger.js.map
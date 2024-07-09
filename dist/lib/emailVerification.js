"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.isDisposableEmail = exports.smtpCheck = exports.validateMxRecords = exports.verifyDomain = exports.validateEmailSyntax = void 0;
const dns_1 = __importDefault(require("dns"));
const axios_1 = __importDefault(require("axios"));
const util_1 = require("util");
const net_1 = __importDefault(require("net"));
const resolveMx = (0, util_1.promisify)(dns_1.default.resolveMx);
const validateEmailSyntax = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};
exports.validateEmailSyntax = validateEmailSyntax;
const verifyDomain = (email) => {
    const domain = email.split('@')[1];
    return Boolean(domain);
};
exports.verifyDomain = verifyDomain;
const validateMxRecords = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const domain = email.split('@')[1];
    try {
        const addresses = yield resolveMx(domain);
        return addresses && addresses.length > 0;
    }
    catch (error) {
        return false;
    }
});
exports.validateMxRecords = validateMxRecords;
const smtpCheck = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const domain = email.split('@')[1];
    try {
        const addresses = yield resolveMx(domain);
        if (addresses.length === 0)
            return false;
        const [mailServer] = addresses;
        const client = net_1.default.createConnection(25, mailServer.exchange);
        return new Promise((resolve) => {
            client.on('data', () => {
                client.write(`HELO ${domain}\r\n`);
                client.write(`MAIL FROM: <test@${domain}>\r\n`);
                client.write(`RCPT TO: <${email}>\r\n`);
                client.write('QUIT\r\n');
            });
            client.on('error', () => resolve(false));
            client.on('end', () => resolve(true));
        });
    }
    catch (error) {
        return false;
    }
});
exports.smtpCheck = smtpCheck;
const isDisposableEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const domain = email.split('@')[1];
    try {
        const response = yield axios_1.default.get(`https://open.kickbox.com/v1/disposable/${domain}`);
        return response.data.disposable;
    }
    catch (error) {
        return false;
    }
});
exports.isDisposableEmail = isDisposableEmail;
const verifyEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isValidSyntax = (0, exports.validateEmailSyntax)(email);
    const isDomainValid = (0, exports.verifyDomain)(email);
    const hasMxRecords = yield (0, exports.validateMxRecords)(email);
    const isSmtpValid = yield (0, exports.smtpCheck)(email);
    const isDisposable = yield (0, exports.isDisposableEmail)(email);
    return {
        email,
        isValidSyntax,
        isDomainValid,
        hasMxRecords,
        isSmtpValid,
        isDisposable,
    };
});
exports.verifyEmail = verifyEmail;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ProtocolParser_1 = require("../src/parsers/ProtocolParser");
const Utils_1 = require("../src/utils/Utils");
class TestParser extends ProtocolParser_1.ProtocolParser {
    injectedPrices;
    injectedUsers;
    async SendMonitoringData(status, start, end, duration, blockFetched, error) {
        // do nothing
    }
    async sendResults(parserResult) {
        // do nothing
    }
    async getBlockNumAndTime() {
        return { currBlockNumber: 10, currTime: 125 };
    }
    async initPrices() {
        if (!this.injectedPrices) {
            throw new Error('Need injected prices for TestParser');
        }
        this.prices = this.injectedPrices;
    }
    async heavyUpdate(blockNumber) {
        if (!this.injectedUsers) {
            throw new Error('Need injectedUsers for TestParser');
        }
        this.users = this.injectedUsers;
        this.userList = Object.keys(this.injectedUsers);
    }
    lightUpdate(blockNumber) {
        throw new Error('Method not implemented.');
    }
}
function getInjectedPrices() {
    return {
        tokenA: 1,
        tokenB: 10,
        tokenC: 100
    };
}
// create 2 users
// u1 has no bad debt
// u2 has no bad debt either
function getUsersWithoutBadDebt() {
    return {
        u1: {
            collaterals: {
                tokenA: 0,
                tokenB: 0,
                tokenC: 100
            },
            debts: {
                tokenA: 10,
                tokenB: 0,
                tokenC: 0
            }
        },
        u2: {
            collaterals: {
                tokenA: 1000,
                tokenB: 10,
                tokenC: 0
            },
            debts: {
                tokenA: 0,
                tokenB: 0,
                tokenC: 10
            }
        }
    };
}
// create 2 users
// u1 has no bad debt
// u2 has bad debt
function getUsersWithBadDebt() {
    return {
        u1: {
            collaterals: {
                tokenA: 0,
                tokenB: 0,
                tokenC: 100
            },
            debts: {
                tokenA: 10,
                tokenB: 0,
                tokenC: 0
            }
        },
        u2: {
            collaterals: {
                tokenA: 0,
                tokenB: 10,
                tokenC: 0
            },
            debts: {
                tokenA: 0,
                tokenB: 0,
                tokenC: 10
            }
        }
    };
}
describe('testing Protocol Parser calc bad debt function', () => {
    test('Test Parser without Bad debt', async () => {
        const parser = new TestParser('http://fakeRpcUrl', 'blockchain_test', 24, 1);
        parser.injectedPrices = getInjectedPrices();
        parser.injectedUsers = getUsersWithoutBadDebt();
        const parserResult = await parser.main(true);
        // should not have any users as bad debt
        const usersWithBadDebt = parserResult.users.map((_) => _.user);
        expect(usersWithBadDebt).toHaveLength(0);
        // user u2 has 10 tokenB as collateral and 10 tokenC as debt
        expect(parserResult.total).toBe('0');
    });
    test('Test Parser with Bad debt', async () => {
        const parser = new TestParser('http://fakeRpcUrl', 'blockchain_test', 24, 1);
        parser.injectedPrices = getInjectedPrices();
        // create 2 users
        // u1 has no bad debt
        // u2 has bad debt
        parser.injectedUsers = getUsersWithBadDebt();
        const parserResult = await parser.main(true);
        const tokenAPrice = parser.injectedPrices['tokenA'];
        const tokenBPrice = parser.injectedPrices['tokenB'];
        const tokenCPrice = parser.injectedPrices['tokenC'];
        // borrows are 10 tokenA and 10 tokenC
        const totalBorrow = 10 * tokenAPrice + 10 * tokenCPrice;
        const totalBorrow18Decimals = new bignumber_js_1.default(totalBorrow).times(Utils_1.CONSTANT_1e18).toFixed();
        expect(parserResult.borrows).toBe(totalBorrow18Decimals);
        // collateral are 10 tokenB and 100 token C
        const totalCollateral = 10 * tokenBPrice + 100 * tokenCPrice;
        const totalCollateral18Decimals = new bignumber_js_1.default(totalCollateral).times(Utils_1.CONSTANT_1e18).toFixed();
        expect(parserResult.deposits).toBe(totalCollateral18Decimals);
        // user u2 should be in the users with bad debt
        const usersWithBadDebt = parserResult.users.map((_) => _.user);
        expect(usersWithBadDebt).toContain('u2');
        // user u2 has 10 tokenB as collateral and 10 tokenC as debt
        const u2BadDebt = 10 * tokenBPrice - 10 * tokenCPrice;
        const u2BadDebt18Decimals = new bignumber_js_1.default(u2BadDebt).times(Utils_1.CONSTANT_1e18).toFixed();
        expect(parserResult.total).toBe(u2BadDebt18Decimals);
    });
});
//# sourceMappingURL=ProtocolParser.test.js.map
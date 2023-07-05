const { ethers } = require('hardhat');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.contracts') });

let abiCoder = new ethers.utils.AbiCoder;

const initializationSchema = ['uint256[]', 'bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'];
const initializationData = [[70, 20, 10], true, '0x5fbdb2315678afecb367f032d93f642f64180aa3', 100, true, true, true, 'po', 'po', 'po'];

const abiEncodedParamsContestPercentage = abiCoder.encode(initializationSchema, initializationData);
let tieredPercentage_FundingGoal = [2, abiEncodedParamsContestPercentage];

/**
0x000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000460000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000002706f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002706f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002706f000000000000000000000000000000000000000000000000000000000000
 */

/**
0000000000000000000000000000000000000000000000000000000000000140
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3
0000000000000000000000000000000000000000000000000000000000000064
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000001
00000000000000000000000000000000000000000000000000000000000001c0
0000000000000000000000000000000000000000000000000000000000000200
0000000000000000000000000000000000000000000000000000000000000240
0000000000000000000000000000000000000000000000000000000000000003
0000000000000000000000000000000000000000000000000000000000000046
0000000000000000000000000000000000000000000000000000000000000014
000000000000000000000000000000000000000000000000000000000000000a
0000000000000000000000000000000000000000000000000000000000000002
706f000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000002
706f000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000002
706f000000000000000000000000000000000000000000000000000000000000
*/

module.exports = tieredPercentage_FundingGoal;
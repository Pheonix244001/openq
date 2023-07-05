const ethers = require('ethers');

function generateDepositId(bountyId, depositCount) {
	const abiCoder = new ethers.utils.AbiCoder;
	const abiEncodedParams = abiCoder.encode(['string', 'uint256'], [bountyId, depositCount]);
	const depositId = ethers.utils.keccak256(abiEncodedParams);
	return depositId;
}

function generateClaimantId(claimant, claimantAsset) {
	const abiCoder = new ethers.utils.AbiCoder;
	const abiEncodedParams = abiCoder.encode(['string', 'string'], [claimant, claimantAsset]);
	const claimId = ethers.utils.keccak256(abiEncodedParams);
	return claimId;
}

module.exports = { generateDepositId, generateClaimantId };
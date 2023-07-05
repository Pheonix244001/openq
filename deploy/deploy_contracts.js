const { ethers, network } = require('hardhat');
const fs = require('fs');
const { optionalSleep } = require('./utils');
require('dotenv').config();

async function deployContracts() {
	console.log('\n------------------------------------------');
	console.log(`DEPLOYING CONTRACTS to ${network.name.toUpperCase()}`);
	console.log('------------------------------------------');

	let mockLink;
	let mockDai;
	let mockNFT;
	let mockDaiBlacklisted;
	if (network.name === 'docker' || network.name === 'localhost') {
		console.log('Deploying MockLink...');
		const MockLink = await ethers.getContractFactory('MockLink');
		mockLink = await MockLink.deploy();
		await mockLink.deployed();
		await optionalSleep(10000);
		console.log(`MockLink Deployed to ${mockLink.address}\n`);

		console.log('Deploying MockNFT...');
		const MockNFT = await ethers.getContractFactory('MockNft');
		mockNFT = await MockNFT.deploy();
		await mockNFT.deployed();
		await optionalSleep(10000);
		console.log(`MockNFT Deployed to ${mockNFT.address}\n`);

		console.log('Deploying MockDai...');
		const MockDai = await ethers.getContractFactory('MockDai');
		mockDai = await MockDai.deploy();
		await mockDai.deployed();
		await optionalSleep(10000);
		console.log(`MockDai Deployed to ${mockDai.address}\n`);

		console.log('Deploying MockDai (Blacklisted)...');
		const MockDaiBlacklisted = await ethers.getContractFactory('MockDai');
		mockDaiBlacklisted = await MockDaiBlacklisted.deploy();
		await mockDaiBlacklisted.deployed();
		await optionalSleep(10000);
		console.log(`MockDai (Blacklisted) Deployed to ${mockDaiBlacklisted.address}\n`);
	}

	console.log('\n------------------------------------------');
	console.log('DEPLOYING OPENQ MAIN CONTRACT');
	console.log('------------------------------------------');

	console.log('Deploying OpenQV2 (Implementation)...');
	const OpenQImplementationV2 = await ethers.getContractFactory('OpenQV1');
	const openQImplementationV2 = await OpenQImplementationV2.deploy();
	await openQImplementationV2.deployed();
	console.log(`OpenQV1 (Implementation) Deployed to ${openQImplementationV2.address}\n`);

	console.log('Deploying OpenQProxy...');
	const OpenQProxy = await ethers.getContractFactory('OpenQProxy');
	let openQProxy = await OpenQProxy.deploy(openQImplementationV2.address, []);
	const confirmation = await openQProxy.deployed();
	const deployBlockNumber = 1;
	await optionalSleep(10000);
	console.log(`OpenQV1 (Proxy) Deployed to ${openQProxy.address} in block number ${deployBlockNumber}\n`);

	// Attach the OpenQV1 ABI to the OpenQProxy address to send method calls to the delegatecall
	openQProxy = await OpenQImplementationV2.attach(openQProxy.address);

	await openQProxy.initialize();

	console.log('\n------------------------------------------');
	console.log('DEPLOYING OPENQ CLAIM MANAGER');
	console.log('------------------------------------------');

	console.log('Deploying Claim Manager Implementation...');
	const ClaimManagerV1 = await ethers.getContractFactory('ClaimManagerV1');
	let claimManagerV1 = await ClaimManagerV1.deploy();
	const claimManagerConfirmation = await claimManagerV1.deployed();
	const deployBlockNumber_claimManager = 1;
	await optionalSleep(10000);
	console.log(`Claim Manager Implementation Deployed to ${claimManagerV1.address} in block number ${deployBlockNumber_claimManager}\n`);

	console.log('Deploying Claim Manager Proxy...');
	const ClaimManagerProxy = await ethers.getContractFactory('OpenQProxy');
	let claimManagerProxy = await ClaimManagerProxy.deploy(claimManagerV1.address, []);
	const claimManagerProxyConfirmation = await claimManagerProxy.deployed();
	const deployBlockNumber_claimManagerProxy = 1;
	await optionalSleep(10000);
	console.log(`Claim Manager Proxy Deployed to ${claimManagerProxy.address} in block number ${deployBlockNumber_claimManagerProxy}\n`);

	// Attach the DepositManager ABI to the OpenQProxy address to send method calls to the delegatecall
	claimManagerProxy = await ClaimManagerV1.attach(claimManagerProxy.address);

	await claimManagerProxy.initialize(process.env.ORACLE_ADDRESS);

	console.log('\n------------------------------------------');
	console.log('DEPLOYING OPENQ DEPOSIT MANAGER');
	console.log('------------------------------------------');

	console.log('Deploying Deposit Manager Implementation...');
	const DepositManager = await ethers.getContractFactory('DepositManagerV1');
	let depositManager = await DepositManager.deploy();
	const depositManagerConfirmation = await depositManager.deployed();
	const deployBlockNumber_depositManager = 1;
	await optionalSleep(10000);
	console.log(`Deposit Manager Implementation Deployed to ${depositManager.address} in block number ${deployBlockNumber_depositManager}\n`);

	console.log('Deploying Deposit Manager Proxy...');
	const DepositManagerProxy = await ethers.getContractFactory('OpenQProxy');
	let depositManagerProxy = await DepositManagerProxy.deploy(depositManager.address, []);
	const depositManagerProxyConfirmation = await depositManagerProxy.deployed();
	const deployBlockNumber_depositManagerProxy = 1;
	await optionalSleep(10000);
	console.log(`Deposit Manager Proxy Deployed to ${depositManagerProxy.address} in block number ${deployBlockNumber_depositManagerProxy}\n`);

	// Attach the DepositManager ABI to the DepositManager proxy address to send method calls to the delegatecall
	depositManagerProxy = await DepositManager.attach(depositManagerProxy.address);

	await depositManagerProxy.initialize();

	console.log('Deploying OpenQTokenWhitelist...');
	const OpenQTokenWhitelist = await ethers.getContractFactory('OpenQTokenWhitelist');
	const openQTokenWhitelist = await OpenQTokenWhitelist.deploy(5);
	await openQTokenWhitelist.deployed();
	await optionalSleep(10000);
	console.log(`OpenQTokenWhitelist Deployed to ${openQTokenWhitelist.address}\n`);

	console.log('\nConfiguring DepositManager with OpenQTokenWhitelist...');
	console.log(`Setting OpenQTokenWhitelist on DepositManager to ${openQTokenWhitelist.address}...`);
	await depositManagerProxy.setTokenWhitelist(openQTokenWhitelist.address);
	await optionalSleep(10000);
	console.log(`OpenQTokenWhitelist successfully set on DepositManager to ${openQTokenWhitelist.address}`);

	console.log('Deploying AtomicBountyV1 implementation...');
	const AtomicBountyV1 = await ethers.getContractFactory('AtomicBountyV1');
	const atomicBountyV1 = await AtomicBountyV1.deploy();
	await atomicBountyV1.deployed();
	await optionalSleep(10000);
	console.log(`AtomicBountyV1 Deployed to ${atomicBountyV1.address}\n`);

	console.log('Deploying OngoingBountyV1 implementation...');
	const OngoingBountyV1 = await ethers.getContractFactory('OngoingBountyV1');
	const ongoingBountyV1 = await OngoingBountyV1.deploy();
	await ongoingBountyV1.deployed();
	await optionalSleep(10000);
	console.log(`OngoingBountyV1 Deployed to ${ongoingBountyV1.address}\n`);

	console.log('Deploying TieredPercentageBountyV1 implementation...');
	const TieredPercentageBountyV1 = await ethers.getContractFactory('TieredPercentageBountyV1');
	const tieredPercentageBountyV1 = await TieredPercentageBountyV1.deploy();
	await tieredPercentageBountyV1.deployed();
	await optionalSleep(10000);
	console.log(`TieredPercentageBountyV1 Deployed to ${tieredPercentageBountyV1.address}\n`);

	console.log('Deploying TieredFixedBountyV1 implementation...');
	const TieredFixedBountyV1 = await ethers.getContractFactory('TieredFixedBountyV1');
	const tieredFixedBountyV1 = await TieredFixedBountyV1.deploy();
	await tieredFixedBountyV1.deployed();
	await optionalSleep(10000);
	console.log(`TieredFixedBountyV1 Deployed to ${tieredFixedBountyV1.address}\n`);

	// Get BountyBeacon contract factory for all bounty types
	const BountyBeacon = await ethers.getContractFactory('BountyBeacon');

	console.log('Deploying AtomicBountyBeacon...');
	const atomicBountyBeacon = await BountyBeacon.deploy(atomicBountyV1.address);
	await atomicBountyBeacon.deployed();
	await optionalSleep(10000);
	console.log(`AtomicBountyBeacon Deployed to ${atomicBountyBeacon.address}\n`);

	console.log('Deploying OngoingBountyBeacon...');
	const ongoingBountyBeacon = await BountyBeacon.deploy(ongoingBountyV1.address);
	await ongoingBountyBeacon.deployed();
	await optionalSleep(10000);
	console.log(`OngoingBountyBeacon Deployed to ${ongoingBountyBeacon.address}\n`);

	console.log('Deploying TieredBountyBeacon...');
	const tieredBountyBeacon = await BountyBeacon.deploy(tieredPercentageBountyV1.address);
	await tieredBountyBeacon.deployed();
	await optionalSleep(10000);
	console.log(`TieredBountyBeacon Deployed to ${tieredBountyBeacon.address}\n`);

	console.log('Deploying TieredFixedBountyBeacon...');
	const tieredFixedBountyBeacon = await BountyBeacon.deploy(tieredFixedBountyV1.address);
	await tieredFixedBountyBeacon.deployed();
	await optionalSleep(10000);
	console.log(`TieredFixedBountyBeacon Deployed to ${tieredFixedBountyBeacon.address}\n`);

	console.log('Deploying BountyFactory...');
	const BountyFactory = await ethers.getContractFactory('BountyFactory');
	const bountyFactory = await BountyFactory.deploy(
		openQProxy.address, 
		atomicBountyBeacon.address, 
		ongoingBountyBeacon.address,
		tieredBountyBeacon.address,
		tieredFixedBountyBeacon.address
	);
	await bountyFactory.deployed();
	await optionalSleep(10000);
	console.log(`BountyFactory Deployed to ${bountyFactory.address}\n`);

	console.log('OPENQ ADDRESSES');
	console.log(`OpenQV1 (Proxy) deployed to: ${openQProxy.address}`);
	console.log(`OpenQV1 (Implementation) deployed to: ${openQImplementationV2.address}`);

	console.log('\nBOUNTY PROXY and IMPLEMENTATION ADDRESSES');
	console.log(`AtomicBountyV1 (Implementation) deployed to ${atomicBountyV1.address}\n`);
	console.log(`OngoingBountyV1 (Implementation) deployed to ${ongoingBountyV1.address}\n`);
	console.log(`TieredPercentageBountyV1 (Implementation) deployed to ${tieredPercentageBountyV1.address}\n`);
	console.log(`TieredFixedBountyV1 (Implementation) deployed to ${tieredFixedBountyV1.address}\n`);
	
	console.log(`AtomicBountyBeacon deployed to ${atomicBountyBeacon.address}`);
	console.log(`OngoingBountyBeacon deployed to ${ongoingBountyBeacon.address}`);
	console.log(`TieredBountyBeacon deployed to ${tieredBountyBeacon.address}`);
	console.log(`TieredFixedBountyBeacon deployed to ${tieredFixedBountyBeacon.address}`);

	console.log(`BountyFactory deployed to: ${bountyFactory.address}`);

	if (network.name === 'docker' || network.name === 'localhost') {
		console.log(`MockLink deployed to: ${mockLink.address}`);
		console.log(`MockDai deployed to: ${mockDai.address}`);
		console.log(`MockNFT deployed to: ${mockNFT.address}`);
		console.log(`MockDai (BlackListed) deployed to: ${mockDaiBlacklisted.address}`);
	}

	console.log('\nConfiguring OpenQV1 with BountyFactory...');
	console.log(`Setting BountyFactory on OpenQV1 to ${bountyFactory.address}...`);
	await openQProxy.setBountyFactory(bountyFactory.address);
	await openQProxy.transferOracle(process.env.ORACLE_ADDRESS);
	await optionalSleep(10000);
	console.log(`BountyFactory successfully set on OpenQV1 to ${bountyFactory.address}`);

	console.log('\nConfiguring OpenQV1 with DepositManager...');
	console.log(`Setting BountyFactory on OpenQV1 to ${depositManagerProxy.address}...`);
	await openQProxy.setDepositManager(depositManagerProxy.address);
	await optionalSleep(10000);
	console.log(`DepositManager successfully set on OpenQV1 to ${depositManagerProxy.address}`);

	console.log('\nConfiguring OpenQV1 with ClaimManager...');
	console.log(`Setting BountyFactory on OpenQV1 to ${claimManagerProxy.address}...`);
	await openQProxy.setClaimManager(claimManagerProxy.address);
	await claimManagerProxy.setOpenQ(openQProxy.address);
	await optionalSleep(10000);
	console.log(`ClaimManager successfully set on OpenQV1 to ${claimManagerProxy.address}`);

	console.log('\nContracts deployed and configured successfully!');

	/* Write newly deployed contract addresses to .env.contracts for use in:
		 - docker-compose environment
		 - other hardhat scripts
	*/
	let addresses;
	if (network.name === 'docker' || network.name === 'localhost') {
		addresses = `OPENQ_PROXY_ADDRESS=${openQProxy.address}
OPENQ_IMPLEMENTATION_ADDRESS=${openQImplementationV2.address}
CLAIM_MANAGER_PROXY_ADDRESS=${claimManagerProxy.address}
CLAIM_MANAGER_IMPLEMENTATION_ADDRESS=${claimManagerV1.address}
DEPOSIT_MANAGER_PROXY_ADDRESS=${depositManagerProxy.address}
DEPOSIT_MANAGER_IMPLEMENTATION_ADDRESS=${depositManager.address}
OPENQ_BOUNTY_FACTORY_ADDRESS=${bountyFactory.address}
ATOMIC_BOUNTY_BEACON_ADDRESS=${atomicBountyBeacon.address}
ONGOING_BOUNTY_BEACON_ADDRESS=${ongoingBountyBeacon.address}
TIERED_BOUNTY_BEACON_ADDRESS=${tieredBountyBeacon.address}
TIERED_FIXED_BOUNTY_BEACON_ADDRESS=${tieredFixedBountyBeacon.address}
OPENQ_TOKEN_WHITELIST_ADDRESS=${openQTokenWhitelist.address}
OPENQ_DEPLOY_BLOCK_NUMBER=${deployBlockNumber}
MOCK_LINK_TOKEN_ADDRESS=${mockLink.address}
MOCK_DAI_TOKEN_ADDRESS=${mockDai.address}
MOCK_NFT_TOKEN_ADDRESS=${mockNFT.address}
MOCK_DAI_BLACKLISTED_TOKEN_ADDRESS=${mockDaiBlacklisted.address}
`;
	} else {
		addresses = `OPENQ_PROXY_ADDRESS=${openQProxy.address}
OPENQ_IMPLEMENTATION_ADDRESS=${openQImplementationV2.address}
CLAIM_MANAGER_PROXY_ADDRESS=${claimManagerProxy.address}
CLAIM_MANAGER_IMPLEMENTATION_ADDRESS=${claimManagerV1.address}
DEPOSIT_MANAGER_PROXY_ADDRESS=${depositManagerProxy.address}
DEPOSIT_MANAGER_IMPLEMENTATION_ADDRESS=${depositManager.address}
OPENQ_BOUNTY_FACTORY_ADDRESS=${bountyFactory.address}
OPENQ_TOKEN_WHITELIST_ADDRESS=${openQTokenWhitelist.address}
OPENQ_DEPLOY_BLOCK_NUMBER=${deployBlockNumber}
MOCK_LINK_TOKEN_ADDRESS=0x326C977E6efc84E512bB9C30f76E30c160eD06FB
MOCK_DAI_TOKEN_ADDRESS=0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1
MOCK_NFT_TOKEN_ADDRESS=0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1
`;
	}


	fs.writeFileSync('.env.contracts', addresses);
}

async function main() {
	await deployContracts();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

module.exports = deployContracts;
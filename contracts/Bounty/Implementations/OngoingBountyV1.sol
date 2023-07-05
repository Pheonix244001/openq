// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Storage/OngoingBountyStorage.sol';

/// @title OngoingBountyV1
/// @author FlacoJones
/// @notice Bounty implementation for multiple contributor, multiple + fixed payout scenarios (e.g. 500 USDC for every submission)
/// @dev OngoingBountyV1 -> OngoingBountyStorageV1 -> BountyCore -> BountyStorageCore -> Core Dependencies (OZ + Custom)
/// @dev Do not add any new storage variables here. Put them in a TieredPercentageBountyStorageV# and release new implementation
contract OngoingBountyV1 is OngoingBountyStorageV1 {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address payable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    constructor() {}

    /// @notice Initializes a bounty proxy with initial state
    /// @param _bountyId The unique bounty identifier
    /// @param _issuer The sender of the mint bounty transaction
    /// @param _organization The organization associated with the bounty
    /// @param _openQ The OpenQProxy address
    /// @param _claimManager The Claim Manager proxy address
    /// @param _depositManager The Deposit Manager proxy address
    /// @param _operation The ABI encoded data determining the type of bounty being initialized and associated data
    /// @dev see IBountyCore.initialize.(_operation) for _operation ABI encoding schema for ONGOING
    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ,
        address _claimManager,
        address _depositManager,
        OpenQDefinitions.InitOperation memory _operation
    ) external initializer {
        require(bytes(_bountyId).length != 0, Errors.NO_EMPTY_BOUNTY_ID);
        require(bytes(_organization).length != 0, Errors.NO_EMPTY_ORGANIZATION);

        __ReentrancyGuard_init();

        __OnlyOpenQ_init(_openQ);
        __ClaimManagerOwnable_init(_claimManager);
        __DepositManagerOwnable_init(_depositManager);

        bountyId = _bountyId;
        issuer = _issuer;
        organization = _organization;
        bountyCreatedTime = block.timestamp;
        nftDepositLimit = 5;

        (
            address _payoutTokenAddress,
            uint256 _payoutVolume,
            bool _hasFundingGoal,
            address _fundingToken,
            uint256 _fundingGoal,
            bool _invoiceRequired,
            bool _kycRequired,
            bool _supportingDocumentsRequired,
            string memory _issuerExternalUserId,
            ,

        ) = abi.decode(
                _operation.data,
                (
                    address,
                    uint256,
                    bool,
                    address,
                    uint256,
                    bool,
                    bool,
                    bool,
                    string,
                    string,
                    string
                )
            );

        bountyType = OpenQDefinitions.ONGOING;
        payoutTokenAddress = _payoutTokenAddress;
        payoutVolume = _payoutVolume;
        hasFundingGoal = _hasFundingGoal;
        fundingToken = _fundingToken;
        fundingGoal = _fundingGoal;
        invoiceRequired = _invoiceRequired;
        kycRequired = _kycRequired;
        supportingDocumentsRequired = _supportingDocumentsRequired;
        issuerExternalUserId = _issuerExternalUserId;
    }

    /// @notice Transfers a payout amount of an ongoing bounty to claimant for claimant asset
    /// @param _payoutAddress The destination address for the funds
    /// @param _closerData ABI-encoded data of the claimant and claimant asset
    /// @dev see IBountyCore.claimOngoingPayout.(_closerData) for _closerData ABI encoding schema
    function claimOngoingPayout(
        address _payoutAddress,
        bytes calldata _closerData
    ) external onlyClaimManager nonReentrant returns (address, uint256) {
        (, string memory claimant, , string memory claimantAsset) = abi.decode(
            _closerData,
            (address, string, address, string)
        );

        bytes32 _claimId = generateClaimId(claimant, claimantAsset);

        claimId[_claimId] = true;
        claimIds.push(_claimId);

        _transferToken(payoutTokenAddress, payoutVolume, _payoutAddress);
        return (payoutTokenAddress, payoutVolume);
    }

    /// @notice Similar to close() for single priced bounties. Stops all withdrawls.
    /// @param _closer Address of the closer
    function closeOngoing(address _closer) external onlyOpenQ {
        require(
            status == OpenQDefinitions.OPEN,
            Errors.CONTRACT_ALREADY_CLOSED
        );
        require(_closer == issuer, Errors.CALLER_NOT_ISSUER);

        status = OpenQDefinitions.CLOSED;
        bountyClosedTime = block.timestamp;
    }

    /// @notice Receives an NFT for this contract
    /// @param _sender Sender of the NFT
    /// @param _tokenAddress NFT token address
    /// @param _tokenId NFT token id
    /// @param _expiration How long before this deposit becomes refundable
    /// @return bytes32 the deposit id
    function receiveNft(
        address _sender,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _expiration,
        bytes calldata
    ) external onlyDepositManager nonReentrant returns (bytes32) {
        require(
            nftDeposits.length < nftDepositLimit,
            Errors.NFT_DEPOSIT_LIMIT_REACHED
        );
        require(_expiration > 0, Errors.EXPIRATION_NOT_GREATER_THAN_ZERO);
        _receiveNft(_tokenAddress, _sender, _tokenId);

        bytes32 depositId = _generateDepositId();

        funder[depositId] = _sender;
        tokenAddress[depositId] = _tokenAddress;
        depositTime[depositId] = block.timestamp;
        tokenId[depositId] = _tokenId;
        expiration[depositId] = _expiration;
        isNFT[depositId] = true;

        deposits.push(depositId);
        nftDeposits.push(depositId);

        return depositId;
    }

    /// @notice Sets the payout for an ongoing bounty
    /// @param _payoutTokenAddress Sets payout token address
    /// @param _payoutVolume Sets payout token volume
    function setPayout(address _payoutTokenAddress, uint256 _payoutVolume)
        external
        onlyOpenQ
    {
        payoutTokenAddress = _payoutTokenAddress;
        payoutVolume = _payoutVolume;
    }

    /// @notice Whether or not invoice has been completed
    /// @param _data ABI encoded data
    /// @dev see IBountyCore.setInvoiceComplete.(_data) for _data ABI encoding schema
    function setInvoiceComplete(bytes calldata _data) external onlyOpenQ {
        (bytes32 _claimId, bool _invoiceComplete) = abi.decode(
            _data,
            (bytes32, bool)
        );
        invoiceComplete[_claimId] = _invoiceComplete;
        invoiceCompleteClaimIds.push(_claimId);
    }

    /// @notice Whether or not supporting documents have been completed
    /// @param _data ABI encoded data
    /// @dev see IBountyCore.setSupportingDocumentsComplete.(_data) for _data ABI encoding schema
    function setSupportingDocumentsComplete(bytes calldata _data)
        external
        onlyOpenQ
    {
        (bytes32 _claimId, bool _supportingDocumentsComplete) = abi.decode(
            _data,
            (bytes32, bool)
        );
        supportingDocumentsComplete[_claimId] = _supportingDocumentsComplete;
        supportingDocumentsCompleteClaimIds.push(_claimId);
    }

    /// @notice Returns the claimIds which have completed supporting documents
    /// @return Documents the return variables of a contract’s function state variable
    /// @dev We return from all IBountyCore.getSupportingDocumentsComplete() as bytes to accomodate different return types
    /// @dev _data (bytes32[])
    /// @dev _data (supportingDocumentsCompleteClaimIds)
    function getSupportingDocumentsComplete()
        external
        view
        returns (bytes memory)
    {
        return abi.encode(supportingDocumentsCompleteClaimIds);
    }

    /// @notice Returns the claimIds which have completed supporting documents
    /// @return Documents the return variables of a contract’s function state variable
    /// @dev We return from all IBountyCore.getInvoiceComplete() as bytes to accomodate different return types
    /// @dev _data (bytes32[])
    /// @dev _data (invoiceCompleteClaimIds)
    function getInvoiceComplete() external view returns (bytes memory) {
        return abi.encode(invoiceCompleteClaimIds);
    }

    /// @notice Returns all claimIds
    /// @return Array of bytes32 claim ids
    function getClaimIds() public view returns (bytes32[] memory) {
        return claimIds;
    }

    /// @notice Generates a unique claimant ID from user and asset
    function generateClaimId(
        string memory claimant,
        string memory claimantAsset
    ) public pure virtual returns (bytes32) {
        return keccak256(abi.encode(claimant, claimantAsset));
    }

    /// @notice receive() method to accept protocol tokens
    receive() external payable {
        revert(
            'Cannot send Ether directly to boutny contract. Please use the BountyV1.receiveFunds() method.'
        );
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '../Implementations/TieredBountyCore.sol';

/// @title TieredPercentageBountyStorageV1
/// @author FlacoJones
/// @notice Backwards compatible, append-only chain of storage contracts inherited by all TieredPercentageBountyStorage implementations
/// @dev Add new variables for upgrades in a new, derived abstract contract that inherits from the previous storage contract version (see: https://forum.openzeppelin.com/t/to-inherit-version1-to-version2-or-to-copy-code-inheritance-order-from-version1-to-version2/28069)
abstract contract TieredPercentageBountyStorageV1 is TieredBountyCore {

}

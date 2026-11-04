// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";

contract MockAggregatorV3 is AggregatorV3Interface {
    uint8 private _decimals;
    string private _description;
    uint256 private _version;

    uint80 private _roundId;
    int256 private _answer;
    uint256 private _startedAt;
    uint256 private _updatedAt;
    uint80 private _answeredInRound;

    constructor(
        uint8 decimals_,
        int256 initialAnswer,
        string memory description_
    ) {
        _decimals = decimals_;
        _description = description_;
        _version = 1;
        updateRoundData(1, initialAnswer, block.timestamp, block.timestamp, 1);
    }

    function updateRoundData(
        uint80 roundId_,
        int256 answer_,
        uint256 startedAt_,
        uint256 updatedAt_,
        uint80 answeredInRound_
    ) public {
        _roundId = roundId_;
        _answer = answer_;
        _startedAt = startedAt_;
        _updatedAt = updatedAt_;
        _answeredInRound = answeredInRound_;
    }

    function setPrice(int256 newPrice) external {
        _roundId++;
        _answer = newPrice;
        _updatedAt = block.timestamp;
        _answeredInRound = _roundId;
    }

    function setUpdatedAt(uint256 newUpdatedAt) external {
        _updatedAt = newUpdatedAt;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function version() external view override returns (uint256) {
        return _version;
    }

    function getRoundData(
        uint80 /* _roundId */
    )
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _answer, _startedAt, _updatedAt, _answeredInRound);
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _answer, _startedAt, _updatedAt, _answeredInRound);
    }
}

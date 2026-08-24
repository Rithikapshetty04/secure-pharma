// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PharmaSupplyChain
 * @dev Immutable blockchain ledger for tracking pharmaceutical batches and supply chain custody.
 */
contract PharmaSupplyChain {
    struct EventRecord {
        string eventType;     // MANUFACTURED, SHIPPED, RECEIVED, TRANSFERRED, DELIVERED
        address recordedBy;
        string custodianOrg;
        string location;
        uint256 timestamp;
        string txHash;
    }

    struct BatchInfo {
        string batchNumber;
        string productCode;
        address manufacturer;
        string manufacturerOrg;
        uint256 creationTimestamp;
        bool exists;
    }

    mapping(string => BatchInfo) public batches;
    mapping(string => EventRecord[]) private batchEvents;
    string[] public allBatchNumbers;

    event BatchRegistered(
        string indexed batchNumber,
        string productCode,
        address indexed manufacturer,
        string manufacturerOrg,
        uint256 timestamp
    );

    event EventRecorded(
        string indexed batchNumber,
        string eventType,
        address indexed custodian,
        string custodianOrg,
        string location,
        uint256 timestamp
    );

    function registerBatch(
        string memory _batchNumber,
        string memory _productCode,
        string memory _manufacturerOrg,
        string memory _initialLocation,
        string memory _initialTxHash
    ) external {
        require(!batches[_batchNumber].exists, "Batch already registered on-chain");
        require(bytes(_batchNumber).length > 0, "Invalid batch number");

        batches[_batchNumber] = BatchInfo({
            batchNumber: _batchNumber,
            productCode: _productCode,
            manufacturer: msg.sender,
            manufacturerOrg: _manufacturerOrg,
            creationTimestamp: block.timestamp,
            exists: true
        });

        allBatchNumbers.push(_batchNumber);

        EventRecord memory initialEvent = EventRecord({
            eventType: "MANUFACTURED",
            recordedBy: msg.sender,
            custodianOrg: _manufacturerOrg,
            location: _initialLocation,
            timestamp: block.timestamp,
            txHash: _initialTxHash
        });

        batchEvents[_batchNumber].push(initialEvent);

        emit BatchRegistered(
            _batchNumber,
            _productCode,
            msg.sender,
            _manufacturerOrg,
            block.timestamp
        );
    }

    function recordEvent(
        string memory _batchNumber,
        string memory _eventType,
        string memory _custodianOrg,
        string memory _location,
        string memory _txHash
    ) external {
        require(batches[_batchNumber].exists, "Batch not found on-chain");

        EventRecord memory newEvent = EventRecord({
            eventType: _eventType,
            recordedBy: msg.sender,
            custodianOrg: _custodianOrg,
            location: _location,
            timestamp: block.timestamp,
            txHash: _txHash
        });

        batchEvents[_batchNumber].push(newEvent);

        emit EventRecorded(
            _batchNumber,
            _eventType,
            msg.sender,
            _custodianOrg,
            _location,
            block.timestamp
        );
    }

    function getBatchEvents(string memory _batchNumber)
        external
        view
        returns (EventRecord[] memory)
    {
        require(batches[_batchNumber].exists, "Batch not registered");
        return batchEvents[_batchNumber];
    }

    function getBatchCount() external view returns (uint256) {
        return allBatchNumbers.length;
    }
}

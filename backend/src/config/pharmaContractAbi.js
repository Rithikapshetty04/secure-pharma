/**
 * PharmaSupplyChain Smart Contract ABI
 * Synchronized from blockchain/artifacts/contracts/PharmaSupplyChain.sol/PharmaSupplyChain.json
 */
const PharmaSupplyChainABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "batchNumber",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "productCode",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "manufacturerOrg",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BatchRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "batchNumber",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "custodian",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "custodianOrg",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "EventRecorded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allBatchNumbers",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "batches",
    "outputs": [
      {
        "internalType": "string",
        "name": "batchNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "productCode",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "manufacturerOrg",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "creationTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBatchCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_batchNumber",
        "type": "string"
      }
    ],
    "name": "getBatchEvents",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "eventType",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "recordedBy",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "custodianOrg",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "txHash",
            "type": "string"
          }
        ],
        "internalType": "struct PharmaSupplyChain.EventRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_batchNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_eventType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_custodianOrg",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_txHash",
        "type": "string"
      }
    ],
    "name": "recordEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_batchNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_productCode",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_manufacturerOrg",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_initialLocation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_initialTxHash",
        "type": "string"
      }
    ],
    "name": "registerBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

module.exports = PharmaSupplyChainABI;

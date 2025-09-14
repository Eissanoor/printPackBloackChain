# Print & Pack Blockchain API - Postman Examples

This document provides examples of API requests for testing the Print & Pack Blockchain Integration API using Postman.

## Setup

1. Import the following requests into Postman
2. Create an environment with the following variables:
   - `base_url`: Your API base URL (e.g., `http://localhost:3000`)
   - `api_key`: Your API key (default: `print-pack-blockchain-api-key`)
   - `auth_token`: A valid authentication token for the Print & Pack system

## API Endpoints

### 1. Check Blockchain Status

**Request:**
```
GET {{base_url}}/api/blockchain/status
```

**Headers:**
```
X-API-Key: {{api_key}}
```

**Response:**
```json
{
  "success": true,
  "message": "Blockchain integration status",
  "data": {
    "enabled": true,
    "network": "goerli",
    "contract_address": "0x1234...5678"
  }
}
```

### 2. Record Sync Approval on Blockchain

**Request:**
```
POST {{base_url}}/api/blockchain/record-approval
```

**Headers:**
```
Content-Type: application/json
X-API-Key: {{api_key}}
```

**Body:**
```json
{
  "syncRequest": {
    "id": "clm3x7z9p000008l4g5tf1jq2",
    "requester_id": "clm3x7z9p000008l4g5tf1jq3",
    "owner_id": "clm3x7z9p000008l4g5tf1jq4",
    "request_type": "gcp",
    "licence_key": "GS1-12345-ABC"
  },
  "action": "approve"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Approval recorded on blockchain successfully",
  "data": {
    "recorded": true,
    "blockchain_data": {
      "approval_id": "7f8e9d6c5b4a3210fedcba9876543210",
      "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "block_number": 12345678,
      "transaction_ref": "GCP_1694563200000_1234"
    }
  }
}
```

### 3. Search Approvals from Blockchain

**Request:**
```
GET {{base_url}}/api/blockchain/search-approvals?requestType=gcp&fromDate=2023-01-01&isActive=true&licenceKey=GS1
```

**Headers:**
```
X-API-Key: {{api_key}}
```

**Query Parameters:**
- `requestId` (optional): Filter by request ID
- `requesterId` (optional): Filter by requester ID
- `ownerId` (optional): Filter by owner ID
- `requestType` (optional): Filter by request type (gcp, excel)
- `licenceKey` (optional): Filter by licence key
- `fromDate` (optional): Filter by date range start (YYYY-MM-DD)
- `toDate` (optional): Filter by date range end (YYYY-MM-DD)
- `isActive` (optional): Filter by active status (true, false)

**Response:**
```json
{
  "success": true,
  "message": "Approvals retrieved successfully",
  "data": {
    "total_found": 1,
    "total_approvals": 2,
    "approvals": [
      {
        "approval_id": "480e24ac73d48cd107ea16cd14798b89",
        "requestId": "clm3x7z9p000008l4g5tf1jq2",
        "requesterId": "clm3x7z9p000008l4g5tf1jq3",
        "ownerId": "clm3x7z9p000008l4g5tf1jq4",
        "requestType": "gcp",
        "licenceKey": "GS1-12345-ABC",
        "timestamp": 1694563200,
        "isActive": true,
        "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "blockNumber": 12345678
      }
    ],
    "search_parameters": {
      "requestType": "gcp",
      "fromDate": "2023-01-01",
      "isActive": "true",
      "licenceKey": "GS1"
    }
  }
}
```

### 4. Get All Approvals from Blockchain

**Request:**
```
GET {{base_url}}/api/blockchain/all-approvals
```

**Headers:**
```
X-API-Key: {{api_key}}
```

**Response:**
```json
{
  "success": true,
  "message": "Blockchain approvals retrieved successfully",
  "data": {
    "total_approvals": 2,
    "approvals": [
      {
        "approval_id": "480e24ac73d48cd107ea16cd14798b89",
        "requestId": "test-request-id",
        "requesterId": "test-requester-id",
        "ownerId": "test-owner-id",
        "requestType": "gcp",
        "licenceKey": "test-licence-key",
        "timestamp": 1694563200,
        "isActive": true,
        "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "blockNumber": 12345678
      },
      {
        "approval_id": "7f8e9d6c5b4a3210fedcba9876543210",
        "requestId": "test-request-id-2",
        "requesterId": "test-requester-id-2",
        "ownerId": "test-owner-id-2",
        "requestType": "excel",
        "licenceKey": "test-licence-key-2",
        "timestamp": 1694563100,
        "isActive": false,
        "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "blockNumber": 12345600
      }
    ]
  }
}
```

### 4. Get Approval Details from Blockchain

**Request:**
```
GET {{base_url}}/api/blockchain/approval/7f8e9d6c5b4a3210fedcba9876543210
```

**Headers:**
```
X-API-Key: {{api_key}}
```

**Response:**
```json
{
  "success": true,
  "message": "Approval details retrieved successfully",
  "data": {
    "requestId": "clm3x7z9p000008l4g5tf1jq2",
    "requesterId": "clm3x7z9p000008l4g5tf1jq3",
    "ownerId": "clm3x7z9p000008l4g5tf1jq4",
    "requestType": "gcp",
    "licenceKey": "GS1-12345-ABC",
    "timestamp": 1694563200,
    "isActive": true,
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "blockNumber": 12345678
  }
}
```

## Integration with Print & Pack System

### 1. Approve Sync Request

**Request:**
```
POST {{base_url}}/api/requests/requestAction
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

**Body:**
```json
{
  "request_id": "clm3x7z9p000008l4g5tf1jq2",
  "action": "approve",
  "message": "I approve this GCP sync request. You can now access my product data."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync request approved successfully",
  "data": {
    "request_id": "clm3x7z9p000008l4g5tf1jq2",
    "action": "approve",
    "status": "approved",
    "requester_notified": true,
    "licence_key": "GS1-12345-ABC",
    "access_granted": true,
    "next_steps": "Requester can now use GCP to sync product data",
      "blockchain": {
        "recorded": true,
        "transaction_ref": "GCP_1694563200000_1234",
        "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "contract_data": {
          "requestId": "clm3x7z9p000008l4g5tf1jq2",
          "requesterId": "clm3x7z9p000008l4g5tf1jq3",
          "ownerId": "clm3x7z9p000008l4g5tf1jq4",
          "requestType": "gcp",
          "licenceKey": "GS1-12345-ABC",
          "timestamp": 1694563200,
          "isActive": true,
          "blockNumber": 12345678
        }
      }
  }
}
```

### 2. Reject Sync Request

**Request:**
```
POST {{base_url}}/api/requests/requestAction
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

**Body:**
```json
{
  "request_id": "clm3x7z9p000008l4g5tf1jq2",
  "action": "reject",
  "message": "I cannot approve this request at this time."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync request rejected successfully",
  "data": {
    "request_id": "clm3x7z9p000008l4g5tf1jq2",
    "action": "reject",
    "status": "rejected",
    "requester_notified": true,
    "licence_key": "GS1-12345-ABC"
  }
}
```

### 3. Get Sync Requests

**Request:**
```
GET {{base_url}}/api/requests/getSyncRequests?status=pending&request_type=gcp&page=1&limit=10&include_blockchain=true
```

**Headers:**
```
X-API-Key: {{api_key}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clm3x7z9p000008l4g5tf1jq2",
      "requester_id": "clm3x7z9p000008l4g5tf1jq3",
      "owner_id": "clm3x7z9p000008l4g5tf1jq4",
      "owner_email": "owner@example.com",
      "request_type": "gcp",
      "status": "approved",
      "licence_key": "GS1-12345-ABC",
      "message": "Please approve my request to access your product data",
      "created_at": "2023-09-12T10:00:00.000Z",
      "updated_at": "2023-09-12T10:00:00.000Z",
      "blockchain_data": {
        "recorded": true,
        "approval_id": "7f8e9d6c5b4a3210fedcba9876543210",
        "contract_data": {
          "requestId": "clm3x7z9p000008l4g5tf1jq2",
          "requesterId": "clm3x7z9p000008l4g5tf1jq3",
          "ownerId": "clm3x7z9p000008l4g5tf1jq4",
          "requestType": "gcp",
          "licenceKey": "GS1-12345-ABC",
          "timestamp": 1694563200,
          "isActive": true,
          "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          "blockNumber": 12345678
        }
      },
      "requester": {
        "id": "clm3x7z9p000008l4g5tf1jq3",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john.doe@example.com",
        "company_name_eng": "ABC Company",
        "company_name_arabic": null,
        "mobile": "+1234567890"
      },
      "owner": {
        "id": "clm3x7z9p000008l4g5tf1jq4",
        "firstname": "Jane",
        "lastname": "Smith",
        "email": "jane.smith@example.com",
        "company_name_eng": "XYZ Corporation",
        "company_name_arabic": null,
        "mobile": "+9876543210"
      }
    },
    {
      "id": "clm3x7z9p000008l4g5tf1jq3",
      "requester_id": "clm3x7z9p000008l4g5tf1jq5",
      "owner_id": "clm3x7z9p000008l4g5tf1jq4",
      "owner_email": "owner@example.com",
      "request_type": "gcp",
      "status": "pending",
      "licence_key": "GS1-54321-XYZ",
      "message": "Requesting access to your product data",
      "created_at": "2023-09-15T14:30:00.000Z",
      "updated_at": "2023-09-15T14:30:00.000Z",
      "blockchain_data": {
        "recorded": false,
        "message": "Only approved requests have blockchain records"
      },
      "requester": {
        "id": "clm3x7z9p000008l4g5tf1jq5",
        "firstname": "Alice",
        "lastname": "Johnson",
        "email": "alice.johnson@example.com",
        "company_name_eng": "Johnson Inc",
        "company_name_arabic": null,
        "mobile": "+1122334455"
      },
      "owner": {
        "id": "clm3x7z9p000008l4g5tf1jq4",
        "firstname": "Jane",
        "lastname": "Smith",
        "email": "jane.smith@example.com",
        "company_name_eng": "XYZ Corporation",
        "company_name_arabic": null,
        "mobile": "+9876543210"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 1,
    "limit": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "meta": {
    "blockchain_data_included": true
  }
}
```

## Error Responses

### 1. Authentication Error

**Response:**
```json
{
  "success": false,
  "message": "API key is required",
  "error": "Unauthorized"
}
```

### 2. Validation Error

**Response:**
```json
{
  "success": false,
  "message": "\"syncRequest.id\" is required",
  "error": "Validation Error"
}
```

### 3. Blockchain Error

**Response:**
```json
{
  "success": false,
  "message": "Failed to record approval on blockchain",
  "error": "Contract transaction failed"
}
```

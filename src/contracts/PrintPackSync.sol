// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PrintPackSync
 * @dev Smart contract for managing product synchronization requests and approvals
 */
contract PrintPackSync {
    // Enum for request types
    enum RequestType { GCP, Excel }
    
    // Enum for request status
    enum RequestStatus { Pending, Approved, Rejected, Completed }
    
    // Structure for sync request
    struct SyncRequest {
        string requestId;          // Unique ID from backend
        address requester;         // Address of the requester
        address owner;             // Address of the product owner
        string requesterEmail;     // Email of the requester
        string ownerEmail;         // Email of the owner
        RequestType requestType;   // Type of request (GCP or Excel)
        string licenceKey;         // GS1 License Key (for GCP requests)
        RequestStatus status;      // Status of the request
        string message;            // Optional message from requester
        string adminNotes;         // Notes from owner/admin
        uint256 createdAt;         // Timestamp of creation
        uint256 updatedAt;         // Timestamp of last update
        uint256 approvedAt;        // Timestamp of approval (if approved)
        uint256 completedAt;       // Timestamp of completion (if completed)
        bool excelProcessed;       // Whether Excel has been processed (for Excel requests)
        string excelFilePath;      // Path to uploaded Excel file (for Excel requests)
    }
    
    // Structure for product data
    struct Product {
        string productId;          // Unique ID from backend
        string gtin;               // Global Trade Item Number
        string licenceKey;         // GS1 License Key
        string brandName;          // Brand name
        string gpcCategoryCode;    // GPC category code
        string gtinType;           // GTIN type (GTIN-8, GTIN-12, etc.)
        uint256 createdAt;         // Timestamp of creation
        uint256 updatedAt;         // Timestamp of last update
        bool active;               // Whether the product is active
    }
    
    // Mapping from request ID to SyncRequest
    mapping(string => SyncRequest) public syncRequests;
    
    // Mapping from product ID to Product
    mapping(string => Product) public products;
    
    // Mapping from requester address to array of request IDs
    mapping(address => string[]) public requesterToRequests;
    
    // Mapping from owner address to array of request IDs
    mapping(address => string[]) public ownerToRequests;
    
    // Mapping from user address to array of product IDs
    mapping(address => string[]) public userToProducts;
    
    // Events
    event SyncRequestCreated(string requestId, address indexed requester, string ownerEmail, RequestType requestType);
    event SyncRequestUpdated(string requestId, RequestStatus status, uint256 timestamp);
    event ProductCreated(string productId, string gtin, address indexed owner);
    event ProductUpdated(string productId, string gtin, address indexed owner);
    
    /**
     * @dev Create a new sync request
     * @param requestId Unique ID from backend
     * @param ownerEmail Email of the product owner
     * @param requestType Type of request (0 for GCP, 1 for Excel)
     * @param licenceKey GS1 License Key (for GCP requests)
     * @param message Optional message from requester
     * @param requesterEmail Email of the requester
     */
    function createSyncRequest(
        string memory requestId,
        string memory ownerEmail,
        uint8 requestType,
        string memory licenceKey,
        string memory message,
        string memory requesterEmail
    ) public {
        require(bytes(requestId).length > 0, "Request ID cannot be empty");
        require(bytes(ownerEmail).length > 0, "Owner email cannot be empty");
        require(requestType <= uint8(RequestType.Excel), "Invalid request type");
        
        // Create sync request
        SyncRequest storage request = syncRequests[requestId];
        request.requestId = requestId;
        request.requester = msg.sender;
        request.owner = address(0); // Will be set when owner approves
        request.requesterEmail = requesterEmail;
        request.ownerEmail = ownerEmail;
        request.requestType = RequestType(requestType);
        request.licenceKey = licenceKey;
        request.status = RequestStatus.Pending;
        request.message = message;
        request.createdAt = block.timestamp;
        request.updatedAt = block.timestamp;
        
        // Add request ID to requester's array
        requesterToRequests[msg.sender].push(requestId);
        
        emit SyncRequestCreated(requestId, msg.sender, ownerEmail, RequestType(requestType));
    }
    
    /**
     * @dev Approve or reject a sync request
     * @param requestId Unique ID of the request
     * @param approve Whether to approve or reject the request
     * @param notes Optional notes from owner/admin
     */
    function approveSyncRequest(
        string memory requestId,
        bool approve,
        string memory notes
    ) public {
        SyncRequest storage request = syncRequests[requestId];
        require(bytes(request.requestId).length > 0, "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");
        
        // Set owner if not already set
        if (request.owner == address(0)) {
            request.owner = msg.sender;
            ownerToRequests[msg.sender].push(requestId);
        } else {
            require(request.owner == msg.sender, "Only the owner can approve/reject this request");
        }
        
        // Update request status
        request.status = approve ? RequestStatus.Approved : RequestStatus.Rejected;
        request.adminNotes = notes;
        request.updatedAt = block.timestamp;
        
        if (approve) {
            request.approvedAt = block.timestamp;
        }
        
        emit SyncRequestUpdated(requestId, request.status, block.timestamp);
    }
    
    /**
     * @dev Mark an Excel request as completed after processing
     * @param requestId Unique ID of the request
     * @param excelFilePath Path to the processed Excel file
     */
    function completeExcelRequest(
        string memory requestId,
        string memory excelFilePath
    ) public {
        SyncRequest storage request = syncRequests[requestId];
        require(bytes(request.requestId).length > 0, "Request does not exist");
        require(request.requestType == RequestType.Excel, "Not an Excel request");
        require(request.status == RequestStatus.Approved, "Request is not approved");
        require(request.owner == msg.sender, "Only the owner can complete this request");
        
        request.status = RequestStatus.Completed;
        request.excelProcessed = true;
        request.excelFilePath = excelFilePath;
        request.completedAt = block.timestamp;
        request.updatedAt = block.timestamp;
        
        emit SyncRequestUpdated(requestId, request.status, block.timestamp);
    }
    
    /**
     * @dev Add a product to the blockchain
     * @param productId Unique ID from backend
     * @param gtin Global Trade Item Number
     * @param licenceKey GS1 License Key
     * @param brandName Brand name
     * @param gpcCategoryCode GPC category code
     * @param gtinType GTIN type
     * @param requestId ID of the sync request that created this product
     */
    function addProduct(
        string memory productId,
        string memory gtin,
        string memory licenceKey,
        string memory brandName,
        string memory gpcCategoryCode,
        string memory gtinType,
        string memory requestId
    ) public {
        require(bytes(productId).length > 0, "Product ID cannot be empty");
        require(bytes(gtin).length > 0, "GTIN cannot be empty");
        
        // Check if request exists and is approved or completed
        SyncRequest storage request = syncRequests[requestId];
        require(bytes(request.requestId).length > 0, "Request does not exist");
        require(
            request.status == RequestStatus.Approved || request.status == RequestStatus.Completed,
            "Request is not approved or completed"
        );
        require(
            request.requester == msg.sender || request.owner == msg.sender,
            "Only requester or owner can add products"
        );
        
        // Create product
        Product storage product = products[productId];
        product.productId = productId;
        product.gtin = gtin;
        product.licenceKey = licenceKey;
        product.brandName = brandName;
        product.gpcCategoryCode = gpcCategoryCode;
        product.gtinType = gtinType;
        product.createdAt = block.timestamp;
        product.updatedAt = block.timestamp;
        product.active = true;
        
        // Add product ID to user's array
        userToProducts[msg.sender].push(productId);
        
        emit ProductCreated(productId, gtin, msg.sender);
    }
    
    /**
     * @dev Update a product
     * @param productId Unique ID of the product
     * @param brandName Brand name
     * @param gpcCategoryCode GPC category code
     * @param active Whether the product is active
     */
    function updateProduct(
        string memory productId,
        string memory brandName,
        string memory gpcCategoryCode,
        bool active
    ) public {
        Product storage product = products[productId];
        require(bytes(product.productId).length > 0, "Product does not exist");
        
        // Check if user has permission to update this product
        bool hasPermission = false;
        string[] memory userProducts = userToProducts[msg.sender];
        for (uint i = 0; i < userProducts.length; i++) {
            if (keccak256(bytes(userProducts[i])) == keccak256(bytes(productId))) {
                hasPermission = true;
                break;
            }
        }
        require(hasPermission, "You don't have permission to update this product");
        
        // Update product
        product.brandName = brandName;
        product.gpcCategoryCode = gpcCategoryCode;
        product.active = active;
        product.updatedAt = block.timestamp;
        
        emit ProductUpdated(productId, product.gtin, msg.sender);
    }
    
    /**
     * @dev Get sync request details
     * @param requestId Unique ID of the request
     * @return All fields of the sync request
     */
    function getSyncRequest(string memory requestId) public view returns (
        string memory,
        address,
        address,
        string memory,
        string memory,
        RequestType,
        string memory,
        RequestStatus,
        string memory,
        string memory,
        uint256,
        uint256,
        uint256,
        uint256,
        bool,
        string memory
    ) {
        SyncRequest storage request = syncRequests[requestId];
        require(bytes(request.requestId).length > 0, "Request does not exist");
        
        return (
            request.requestId,
            request.requester,
            request.owner,
            request.requesterEmail,
            request.ownerEmail,
            request.requestType,
            request.licenceKey,
            request.status,
            request.message,
            request.adminNotes,
            request.createdAt,
            request.updatedAt,
            request.approvedAt,
            request.completedAt,
            request.excelProcessed,
            request.excelFilePath
        );
    }
    
    /**
     * @dev Get product details
     * @param productId Unique ID of the product
     * @return All fields of the product
     */
    function getProduct(string memory productId) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        uint256,
        uint256,
        bool
    ) {
        Product storage product = products[productId];
        require(bytes(product.productId).length > 0, "Product does not exist");
        
        return (
            product.productId,
            product.gtin,
            product.licenceKey,
            product.brandName,
            product.gpcCategoryCode,
            product.gtinType,
            product.createdAt,
            product.updatedAt,
            product.active
        );
    }
    
    /**
     * @dev Get all request IDs for a requester
     * @param requester Address of the requester
     * @return Array of request IDs
     */
    function getRequesterRequests(address requester) public view returns (string[] memory) {
        return requesterToRequests[requester];
    }
    
    /**
     * @dev Get all request IDs for an owner
     * @param owner Address of the owner
     * @return Array of request IDs
     */
    function getOwnerRequests(address owner) public view returns (string[] memory) {
        return ownerToRequests[owner];
    }
    
    /**
     * @dev Get all product IDs for a user
     * @param user Address of the user
     * @return Array of product IDs
     */
    function getUserProducts(address user) public view returns (string[] memory) {
        return userToProducts[user];
    }
}

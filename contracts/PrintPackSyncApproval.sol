// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PrintPackSyncApproval
 * @dev Smart contract to record product sync approvals for Print & Pack
 */
contract PrintPackSyncApproval {
    // Struct to store approval data
    struct SyncApproval {
        string requestId;
        string requesterId;
        string ownerId;
        string requestType;
        string licenceKey;
        uint256 timestamp;
        bool isActive;
    }
    
    // Mapping from approval ID to SyncApproval
    mapping(string => SyncApproval) public approvals;
    
    // Array to store all approval IDs
    string[] public approvalIds;
    
    // Events
    event ApprovalRecorded(string approvalId, string requesterId, string ownerId, string requestType, uint256 timestamp);
    event ApprovalDeactivated(string approvalId, uint256 timestamp);
    
    /**
     * @dev Record a new sync approval
     * @param approvalId Unique identifier for the approval
     * @param requestId The sync request ID
     * @param requesterId ID of the user requesting sync
     * @param ownerId ID of the product owner
     * @param requestType Type of request (gcp or excel)
     * @param licenceKey GS1 licence key if applicable
     */
    function recordApproval(
        string memory approvalId,
        string memory requestId,
        string memory requesterId,
        string memory ownerId,
        string memory requestType,
        string memory licenceKey
    ) public {
        // Ensure approval ID doesn't exist already
        require(bytes(approvals[approvalId].requestId).length == 0, "Approval ID already exists");
        
        // Create new approval record
        SyncApproval memory newApproval = SyncApproval({
            requestId: requestId,
            requesterId: requesterId,
            ownerId: ownerId,
            requestType: requestType,
            licenceKey: licenceKey,
            timestamp: block.timestamp,
            isActive: true
        });
        
        // Store approval
        approvals[approvalId] = newApproval;
        approvalIds.push(approvalId);
        
        // Emit event
        emit ApprovalRecorded(approvalId, requesterId, ownerId, requestType, block.timestamp);
    }
    
    /**
     * @dev Deactivate an existing approval
     * @param approvalId ID of the approval to deactivate
     */
    function deactivateApproval(string memory approvalId) public {
        // Ensure approval exists and is active
        require(bytes(approvals[approvalId].requestId).length > 0, "Approval does not exist");
        require(approvals[approvalId].isActive, "Approval is already inactive");
        
        // Deactivate approval
        approvals[approvalId].isActive = false;
        
        // Emit event
        emit ApprovalDeactivated(approvalId, block.timestamp);
    }
    
    /**
     * @dev Get approval details
     * @param approvalId ID of the approval to retrieve
     * @return requestId The sync request ID
     * @return requesterId ID of the user requesting sync
     * @return ownerId ID of the product owner
     * @return requestType Type of request (gcp or excel)
     * @return licenceKey GS1 licence key if applicable
     * @return timestamp Time when approval was recorded
     * @return isActive Whether the approval is still active
     */
    function getApproval(string memory approvalId) public view returns (
        string memory requestId,
        string memory requesterId,
        string memory ownerId,
        string memory requestType,
        string memory licenceKey,
        uint256 timestamp,
        bool isActive
    ) {
        SyncApproval memory approval = approvals[approvalId];
        return (
            approval.requestId,
            approval.requesterId,
            approval.ownerId,
            approval.requestType,
            approval.licenceKey,
            approval.timestamp,
            approval.isActive
        );
    }
    
    /**
     * @dev Get total number of approvals
     * @return Total number of approvals recorded
     */
    function getTotalApprovals() public view returns (uint256) {
        return approvalIds.length;
    }
    
    /**
     * @dev Get approval ID by index
     * @param index Index in the approvals array
     * @return Approval ID at the given index
     */
    function getApprovalIdByIndex(uint256 index) public view returns (string memory) {
        require(index < approvalIds.length, "Index out of bounds");
        return approvalIds[index];
    }
}

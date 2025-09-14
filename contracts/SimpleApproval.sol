// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleApproval
 * @dev A simplified version of the PrintPackSyncApproval contract
 */
contract SimpleApproval {
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
     */
    function recordApproval(
        string memory approvalId,
        string memory requestId,
        string memory requesterId,
        string memory ownerId,
        string memory requestType,
        string memory licenceKey
    ) public {
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
     */
    function deactivateApproval(string memory approvalId) public {
        // Deactivate approval
        approvals[approvalId].isActive = false;
        
        // Emit event
        emit ApprovalDeactivated(approvalId, block.timestamp);
    }
    
    /**
     * @dev Get approval details
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
     */
    function getTotalApprovals() public view returns (uint256) {
        return approvalIds.length;
    }
    
    /**
     * @dev Get approval ID by index
     */
    function getApprovalIdByIndex(uint256 index) public view returns (string memory) {
        require(index < approvalIds.length, "Index out of bounds");
        return approvalIds[index];
    }
}

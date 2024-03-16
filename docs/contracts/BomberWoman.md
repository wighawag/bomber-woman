---
outline: deep
---
# BomberWoman



## Functions

### **getAvatar**

Get the avatar state

*sig hash*: `0x1328ec9b`

*Signature*: getAvatar(uint256)

function getAvatar(uint256 avatarID) view returns ((uint120 stake, uint64 position, uint64 epoch, uint8 bombs, bool dead))

| Name | Description 
| ---- | ----------- 
| avatarID | the avatar id to retrieve

### **getCommitment**

The commitment to be revealed. zeroed if no commitment need to be made.

*sig hash*: `0x69bcdb7d`

*Signature*: getCommitment(uint256)

function getCommitment(uint256 avatarID) view returns ((bytes24 hash, uint64 epoch) commitment)

| Name | Description 
| ---- | ----------- 
| avatarID | the address of which to retrieve the commitment

### **getConfig**

return the config used to initialise the Game

*sig hash*: `0xc3f909d4`

*Signature*: getConfig()

function getConfig() view returns ((uint256 startTime, uint256 commitPhaseDuration, uint256 revealPhaseDuration, address time) config)

### **cancelCommitments**

called by players to cancel their current commitment  Can only be called during the commit phase in which the commitment was made  It cannot be called afterward

*sig hash*: `0x118a6abd`

*Signature*: cancelCommitments(uint256[])

function cancelCommitments(uint256[] avatarIDs)

### **makeCommitments**

called by players to commit their moves  this can be called multiple time in the same epoch, the last call overriding the previous.  When a commitment is made, it needs to be revealed in the reveal phase of the same epoch.abi  If missed, player can still reveal its moves but none of them will be resolved.   The player would lose its associated reserved amount.

*sig hash*: `0x35c67823`

*Signature*: makeCommitments((uint256,bytes24)[],address)

function makeCommitments((uint256 avatarID, bytes24 hash)[] commitments, address payee) payable

| Name | Description 
| ---- | ----------- 
| commitments | the avatarId, hash pair which the action belongs to
| payee | address to send ETH to along the commitment. Can be used to pay for reveal

### **acknowledgeMissedReveals**

should only be called as last resort this will burn all tokens in reserve If player has access to the secret, better call `acknowledgeMissedReveal`

*sig hash*: `0x6d4543f3`

*Signature*: acknowledgeMissedReveals(uint256[])

function acknowledgeMissedReveals(uint256[] avatarIDs)

### **reveal**

called by player to reveal their moves  this is where the core logic of the game takes place  This is where the game board evolves  The game is designed so that reveal order does not matter

*sig hash*: `0xcee40a27`

*Signature*: reveal((uint256,(uint64[],uint8)[],bytes32)[],address)

function reveal((uint256 avatarID, (uint64[] path, uint8 actionType)[] actions, bytes32 secret)[] moves, address payee) payable

| Name | Description 
| ---- | ----------- 
| moves | the actual moves
| payee | address to send ETH to along the reveal


## Events

### **CommitmentCancelled**

A player has cancelled its current commitment (before it reached the reveal phase)

event CommitmentCancelled(uint256 indexed avatarID, uint64 indexed epoch)

| Name | Description 
| ---- | ----------- 
| avatarID | avatar whose commitment is cancelled
| epoch | epoch number on which this commit belongs to

### **CommitmentMade**

A player has commited to make a move and reveal it on the reveal phase

event CommitmentMade(uint256 indexed avatarID, uint64 indexed epoch, bytes24 commitmentHash)

| Name | Description 
| ---- | ----------- 
| avatarID | avatar whose commitment is made
| epoch | epoch number on which this commit belongs to
| commitmentHash | the hash of moves

### **CommitmentRevealed**

Player has revealed its previous commitment

event CommitmentRevealed(uint256 indexed avatarID, uint64 indexed epoch, bytes24 indexed commitmentHash, (uint64[] path, uint8 actionType)[] actions)

| Name | Description 
| ---- | ----------- 
| avatarID | avatar id whose action is commited
| epoch | epoch number on which this commit belongs to
| commitmentHash | the hash of the moves
| actions | the actions

### **CommitmentVoid**

A player has acknowledged its failure to reveal its previous commitment

event CommitmentVoid(uint256 indexed avatarID, uint64 indexed epoch)

| Name | Description 
| ---- | ----------- 
| avatarID | the account that made the commitment
| epoch | epoch number on which this commit belongs to

### **Approval**

Triggered when a token is approved to be sent by another account  Note tat the approval get reset when a Transfer event for that same token is emitted.

event Approval(address indexed owner, address indexed approved, uint256 indexed tokenID)

| Name | Description 
| ---- | ----------- 
| owner | current owner of the token
| approved | account who can know transfer on the owner's behalf
| tokenID | id of the token being approved

### **ApprovalForAll**

Triggered when an account approve or disaprove another to transfer on its behalf

event ApprovalForAll(address indexed owner, address indexed operator, bool approved)

| Name | Description 
| ---- | ----------- 
| owner | the account granting rights over all of its token
| operator | account who can know transfer on the owner's behalf
| approved | whether it is approved or not

### **Transfer**

Triggered when a token is transferred

event Transfer(address indexed from, address indexed to, uint256 indexed tokenID)

| Name | Description 
| ---- | ----------- 
| from | the account the token is sent from
| to | the account the token is sent to
| tokenID | id of the token being sent


## Errors

### **AvatarIsDead**

Player have to reveal if they can


error AvatarIsDead(uint256 avatarID)

| Name | Description 
| ---- | ----------- 
| avatarID | the id of the dead avatar The avatar is dead, no action possible

### **CanStillReveal**

Player have to reveal if they can prevent player from acknowledging missed reveal if there is still time to reveal.


error CanStillReveal()

### **CommitmentHashNotMatching**

Player have to reveal their commitment using the exact same move values  If they provide different value, the commitment hash will differ and BomberWoman will reject their reveal.


error CommitmentHashNotMatching()

### **GameNotStarted**

Game has not started yet, can't perform any action


error GameNotStarted()

### **ImpossibleConfiguration**

The cell configuration is invalid This can happen win debug mode where admin can setup cell bypassing moves rules For example when setting up neighborood configuration that would require a cell to have negative life


error ImpossibleConfiguration()

### **InCommitmentPhase**

When in Commit phase, player can make new commitment but they cannot reveal their move yet.


error InCommitmentPhase()

### **InRevealPhase**

When in Reveal phase, it is not possible to commit new moves or cancel previous commitment  During Reveal phase, players have to reveal their commitment, if not already done.


error InRevealPhase()

### **InvalidEpoch**

Player can only reveal their move in the same epoch they commited.abi  If a player reveal later it can only do to minimize the reserve burn cost by calling : `acknowledgeMissedReveal`


error InvalidEpoch()

### **NothingToReveal**

Player can only reveal moves they commited.


error NothingToReveal()

### **PreviousCommitmentNotRevealed**

Previous commitment need to be revealed before making a new one. Even if the corresponding reveal phase has passed.

  It is also not possible to withdraw any amount from reserve until the commitment is revealed.

If player lost the information to reveal, it can acknowledge failure which will burn all its reserve.


error PreviousCommitmentNotRevealed()


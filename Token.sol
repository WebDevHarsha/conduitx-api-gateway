// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Conduit_Agent_Token is ERC20{
    constructor() ERC20("Conduit_Agent_Token", "CAT"){
         _mint(msg.sender,10000*10**18);
    }
}

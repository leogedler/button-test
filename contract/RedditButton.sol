// Write a contract in Solidity that is similar to The Button(The Button (Reddit) on reddit

// (r/thebutton - the button • r/thebutton), where everyone pays a fixed amount of ether to call pressButton

// and then if 3 blocks pass without someone calling pressButton, whoever pressed the button last can call

// claimTreasure and get everyone's deposits. Another analogy: musical chairs, but with (virtual) money!

// Resources

pragma solidity ^0.4.18;

contract RedditButton {
    address public lastDepositAddress;

    uint256 public amount=0;

    uint256 public latestBlock=0;

    uint256 public sum = 0;

    function RedditButton() public{

        latestBlock = block.number;
        
        lastDepositAddress = msg.sender;

    }

    function sumUp() public{
        sum = sum + 1;
    }

    function claimTreasure() public{

        require(block.number - latestBlock >= 3);
        
        require(msg.sender == lastDepositAddress);
        
        msg.sender.transfer(address(this).balance);
        amount = 0;

    }

    function pressButton() public payable {

        // transfer 1 eth to contract
        
        require(msg.value >= 1000000000000000000);
        
        msg.sender.transfer(msg.value-1000000000000000000);
        
        lastDepositAddress = msg.sender;
        
        amount++;
        
        latestBlock = block.number;
    
    }

}


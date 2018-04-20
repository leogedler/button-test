const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);

const compiledRedditButton = require('../build/RedditButton.json');

let redditButton;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    redditButton = await new web3.eth.Contract(JSON.parse(compiledRedditButton.interface))
    .deploy({ data: compiledRedditButton.bytecode })
    .send( { from: accounts[0], gas: '1000000' });
    redditButton.setProvider(provider);
 
 });

 describe('RedditButton Contract', () => {
 
    it('deploys a contract', () => {
        assert.ok(redditButton.options.address);
    })
 
    it('register the last sender address if was sent 1 ether', async () => {
        const pressButton = await redditButton.methods.pressButton().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        const lastDepositAddress = await redditButton.methods.lastDepositAddress().call();
        assert.equal(accounts[0], lastDepositAddress);
    })

    it('not register the last sender address if wasnt sent 1 ether', async () => {
        try {
            const pressButton = await redditButton.methods.pressButton().send({
                from: accounts[0],
                value: web3.utils.toWei('0.1', 'ether')
            });
            const lastDepositAddress = await redditButton.methods.lastDepositAddress().call();
            assert(false)
        } catch (error) {
            assert.ok(error);
        }
    })

    it('increases the amount count with each press', async () => {
        const pressButton1 = await redditButton.methods.pressButton().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        const pressButton2 = await redditButton.methods.pressButton().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });
        const amount = await redditButton.methods.amount().call();
        assert.equal(amount, 2);
    })

    
    it('not sent the balance if 3 blocks havent passed', async()=>{
        await redditButton.methods.pressButton().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        try {
            await redditButton.methods.claimTreasure().send({from: accounts[0]});
            assert(false);
        } catch (error) {
            assert.ok(error);
        }
    })

    it('not sent the balance if the last address is not the same as the sender address', async()=>{
        await redditButton.methods.pressButton().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        for (let index = 0; index < 3; index++) {
            await redditButton.methods.sumUp().send({
                from: accounts[0],
                gas: '1000000'
            });            
        }

        try {
            await redditButton.methods.claimTreasure().send({from: accounts[1]});
            assert(false);
        } catch (error) {
            const amount = await redditButton.methods.amount().call();    
            assert.equal(amount, 1);
        }
    })

    it('it sent the balance to the last address after 3 block and reset the amount counter', async () => {

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        
        await redditButton.methods.pressButton().send({
            from: accounts[0],
            value: web3.utils.toWei('1', 'ether')
        });

        for (let index = 0; index < 3; index++) {
            await redditButton.methods.sumUp().send({
                from: accounts[0],
                gas: '1000000'
            });            
        }

        await redditButton.methods.claimTreasure().send({from: accounts[0]});
        const amount = await redditButton.methods.amount().call();
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = initialBalance - finalBalance;

        assert.equal(amount, 0);
        assert(difference < web3.utils.toWei('0.1', 'ether'));
    })
   
})
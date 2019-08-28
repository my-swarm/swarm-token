## Deployment terminal logs

```
$ truffle migrate --reset --network mainnetPrivateKey

Compiling your contracts...
===========================
> Compiling .\contracts\access\Controlled.sol
> Compiling .\contracts\token\ISwarmTokenControlled.sol
> Compiling .\contracts\token\ISwarmTokenRecipient.sol
> Artifacts written to .\build\contracts
> Compiled successfully using:
   - solc: 0.5.11+commit.c082d0b4.Emscripten.clang

1_deploy_token.js
=================

   Deploying 'SwarmToken'
   ----------------------
   > transaction hash:    0x1238545811395c0cd3b77149a0b10a04d51172b482d015c4c105bf3bd182216b
   > Blocks: 1            Seconds: 12
   > contract address:    0x3505f494c3f0fed0b594e01fa41dd3967645ca39
   > block number:        8438475
   > block timestamp:     1566992824
   > account:             0xc39bf343cfc1083497549d7f10468769becc79e4
   > balance:             0.115906022153243696
   > gas used:            2626415
   > gas price:           10 gwei
   > value sent:          0 ETH
   > total cost:          0.02626415 ETH

   ...
```

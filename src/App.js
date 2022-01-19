import './App.css';
import logo from './jsic.png';
import contract from './abi.json';
import mainConfig from './config.json';
import { useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';

const contractAddress = mainConfig.CONTRACT_ADDRESS;
const abi = contract;

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [mintState, setMintState] = useState("none");
  const [transactionResult, setTransactionResult] = useState(null);
  const [mintCost, setMintCost] = useState(null);
  const [maxSupply, setMaxSupply] = useState(null);
  const [currSupply, setCurrSupply] = useState(null);
  const [walletUp, setWalletUp] = useState(null);
  const [mintAmount, setMintAmount] = useState(1);


  const checkWalletIsConnected = async () => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const netInfo = await provider.getNetwork()
    console.log(netInfo.chainId)

    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      alert("Make sure you have Metamask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }

    if (netInfo.chainId !== 4) {
      alert('Switch network to Rinkeby in the wallet to continue!')
      return;
    } else {
      setWalletUp(true)
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
      console.log("Setting mint in progress to: ", mintState);
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;
    
    if (!ethereum) {
      alert('Please install Metamask!');
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      alert(err)
    }
  }

  const getContractInfo = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const nftContract = new ethers.Contract(contractAddress, abi, provider);
        let cost = await nftContract.cost();
        let symbol = await nftContract.symbol();
        let maxSupply = await nftContract.maxSupply();
        let totalSupply = await nftContract.totalSupply();
        //console.log(symbol);
        //console.log(ethers.utils.formatEther(cost), "eth");
        //console.log(maxSupply.toString());
        //console.log(totalSupply.toString());
        setMaxSupply(maxSupply.toString());
        setMintCost(ethers.utils.formatEther(cost));
        setCurrSupply(totalSupply.toString());
      } else {
        console.log("ethereum object does not exist")
      }
    } catch (err) {
      console.log(err);
    }
  }

  const mintNftHandler = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, abi, signer);
        let nftPrice = await nftContract.cost();
        let cost = BigNumber.from(nftPrice.toString())

        console.log("Initialize payment, cost is", nftPrice.toString(), "mint amount is:", mintAmount.toString());
        setMintState("Inititialize...");
        let nftTxn = await nftContract.mint(mintAmount, { value: cost.mul(mintAmount) });

        console.log("Minting... please wait");
        setMintState("Mint in progress...");
        await nftTxn.wait();

        console.log(`Minted, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        setTransactionResult(`${mainConfig.SCAN_MAIN_URL}/tx/${nftTxn.hash}`);
        setMintState("Minted");

      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {
      setMintState("An error occured, refresh the page");
      console.log(err);
    }
  }

  const connectWalletButton = () => {
    if (walletUp) {
      return (
        <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
          Connect Wallet
        </button>
      )
    } else {
      return (
        <p className='redText'>Wallet must be connected to the Rinkeby test net. Connect and referesh the page.</p>
      )
    }
  }

  useEffect(() => {
    checkWalletIsConnected();
  }, [])

  let incrementMintCount = () => {
    if (mintAmount < 100) {
      setMintAmount(mintAmount + 1);
    }
  };

  let decrementMintCount = () => {
    if (mintAmount > 1) {
      setMintAmount(mintAmount - 1);
    }
  };

  const mintNft = () => {
    console.log(mintState);
    getContractInfo();
    if (mintState === "none") {
      return (
        <>
          <p className='extraInfo'>
            Mint cost: { mintCost } eth, current supply: { currSupply } / { maxSupply } <br/>
          </p>
          <p>Amount to mint: <button onClick={decrementMintCount}>-</button> { mintAmount } <button onClick={incrementMintCount}>+</button>
          </p>
          <button onClick={mintNftHandler} className='cta-button mint-nft-button'>
            Mint NFT
          </button><br/>
          <p className='extraInfo'>Connected with address: { currentAccount }</p>
        </>
      );
    } else {
      return (
        <>
          <p className='extraInfo'>{ mintState }</p>
        </>
      );
    }
  }

  const showTransactionResult = () => {
    return (
      <>
        <p className='extraInfo'>Transaction info:
          <a href={ transactionResult } target="_blank" rel="noreferrer"> { transactionResult }</a>
        </p>
        <p className='extraInfo'>
          <a href={ mainConfig.MARKETPLACE_PROFILE } target="_blank" rel="noreferrer">Check your collections on Opensea</a>,
          testnets may take some time to update.
        </p>
        <p className='greenText'>Refresh the page to mint another.</p>
      </>
    );
  }

  return (
    <div className="App">
      <h3>NewPHUNKS TEST</h3>
      <img src={ logo } alt="logo"></img>
      <br/>
      Contract addr on { mainConfig.NETWORK.NAME }: <a 
        className="app-url"
        href={ mainConfig.SCAN_LINK }
        target="_blank"
        rel="noopener noreferrer"
      >
          { contractAddress }
      </a>
      <br/><br/>
      <a
        className="app-url"
        href={ mainConfig.MARKETPLACE_LINK }
        target="_blank"
        rel="noopener noreferrer" 
      >
        Collection on Opensea
      </a>
      <br/><br/>
      <div>
        {currentAccount ? mintNft() : connectWalletButton()}
      </div>
      <div>
        { transactionResult ? showTransactionResult() : "" }
      </div>
      <p> This is on Rinkeby testnet, get some test ether here: <a
          href="https://faucets.chain.link/rinkeby" target="_blank" rel="noreferrer">
          Chain Link Rinkeby Faucet
        </a>
      </p>
      <p>Once Mint button is pressed wait the page to be updated with transaction details.</p>
  </div>
  );
}

export default App;

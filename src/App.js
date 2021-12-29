import './App.css';
import logo from './jsic.png';
import contract from './abi.json';
import mainConfig from './config.json';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const contractAddress = mainConfig.CONTRACT_ADDRESS;
const abi = contract;

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [mintState, setMintState] = useState("none");
  const [transactionResult, setTransactionResult] = useState(null);
  const [mintCost, setMintCost] = useState(null);
  const [maxSupply, setMaxSupply] = useState(null);
  const [currSupply, setCurrSupply] = useState(null);

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      alert("Make sure you have Metamask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
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
      alert("Please install Metamask!");
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
        console.log(symbol);
        console.log(ethers.utils.formatEther(cost), "eth");
        console.log(maxSupply.toString());
        console.log(totalSupply.toString());
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
        const nftPrice = mainConfig.WEI_COST;

        console.log("Initialize payment");
        setMintState("Inititialize...");
        let nftTxn = await nftContract.mint(1, { value: nftPrice });

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
      console.log(err);
    }
  }

  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }

  useEffect(() => {
    checkWalletIsConnected();
  }, [])

  const mintNft = () => {
    console.log(mintState);
    getContractInfo();
    if (mintState === "none") {
      return (
        <>
          <p className='extraInfo'>
            Mint cost: { mintCost } eth, current supply: { currSupply } / { maxSupply } <br/>
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
      <h3>Jaded Souls Intellectual Club NFT</h3>
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
  </div>
  );
}

export default App;

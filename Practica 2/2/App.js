import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { create } from "kubo-rpc-client";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import logo from "./logo.svg";
import { addresses, abis } from "./contracts";

function App() {
  const [wallet, setWallet] = useState("");
  const [owner, setOwner] = useState("");
  const [goal, setGoal] = useState("-");
  const [total, setTotal] = useState("-");
  const [moneyLeft, setMoneyLeft] = useState("-");
  const [contributorsCount, setContributorsCount] = useState("-");
  const [myContribution, setMyContribution] = useState("-");
  const [timeLeft, setTimeLeft] = useState("-");
  const [campaignIPFS, setCampaignIPFS] = useState("-");
  const [myNFT, setMyNFT] = useState("");
  const [file, setFile] = useState(null);

  const providerRef = useRef(null);
  const contractRef = useRef(null);

  // Asegurar red Sepolia
  const ensureSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: {
                name: "SepoliaETH",
                symbol: "SepoliaETH",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  };

  // Conectar MetaMask y crear contrato
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Por favor instala MetaMask");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      const signer = provider.getSigner();
      const account = await signer.getAddress();

      providerRef.current = provider;

      // Usa la clave que tengas en contracts.js (ipfs en tu caso)
      const contract = new ethers.Contract(
        addresses.ipfs,
        abis.ipfs,
        signer
      );

      contractRef.current = contract;
      setWallet(account);

      // Evitar duplicar listeners si se pulsa el botón varias veces
      contract.removeAllListeners("NFTMinted");
      contract.on("NFTMinted", (contributor, tokenId, metadataIpfsHash) => {
        if (contributor.toLowerCase() === account.toLowerCase()) {
          const url = "http://localhost:8080/ipfs/" + metadataIpfsHash; // metadata.json
          setMyNFT(url);
        }
      });

      refreshInfo();
    } catch (err) {
      console.error("Error al conectar MetaMask:", err);
      alert("Error al conectar MetaMask");
    }
  };

  // Refrescar info de campaña
  const refreshInfo = async () => {
    const contract = contractRef.current;
    if (!contract) {
      console.warn("Contrato no inicializado aún");
      return;
    }

    const _goal = await contract.showGoal();
    const _total = await contract.totalContributed();
    const _left = await contract.showMoneyLeft();
    const _count = await contract.showContributorsCount();
    const _mine = await contract.showMyContribution();
    const _deadline = await contract.deadline();
    const _campaignIPFS = await contract.campaignFileIPFS();
    const _owner = await contract.owner();

    setGoal(_goal.toString());
    setTotal(_total.toString());
    setMoneyLeft(_left.toString());
    setContributorsCount(_count.toString());
    setMyContribution(_mine.toString());
    setTimeLeft(calculateTimeLeft(_deadline.toNumber()));
    setCampaignIPFS(_campaignIPFS);
    setOwner(_owner);
  };

  // Contribuir y mintear NFT usando WEI y metadata en IPFS
  const contributeNFT = async () => {
    const contract = contractRef.current;
    const provider = providerRef.current;

    if (!contract || !provider) {
      alert("Conecta la wallet antes de contribuir");
      return;
    }

    if (!campaignIPFS || campaignIPFS === "-") {
      alert("El owner aún no ha configurado la imagen de campaña en IPFS.");
      return;
    }

    const input = document.getElementById("cantidadWEI");
    const valueStr = (input?.value || "0").trim();

    let value;
    try {
      // Interpretamos directamente el valor como WEI (entero)
      value = ethers.BigNumber.from(valueStr);
    } catch (e) {
      alert("Cantidad en WEI no válida (usa solo números enteros)");
      return;
    }

    if (value.lte(0)) {
      alert("Introduce un valor en WEI mayor que 0");
      return;
    }

    try {
      const signer = provider.getSigner();
      const account = await signer.getAddress();

      // 1) Construimos el JSON de metadatos
      const metadata = {
        name: "Crowdfunding Supporter NFT",
        description: "NFT por contribuir a la campaña de crowdfunding.",
        document: `http://localhost:8080/ipfs/${campaignIPFS}`, // mismo documento para todos los NFTs
        attributes: [
          {
            trait_type: "Donor",
            value: account,
          },
          {
            trait_type: "Amount (wei)",
            value: value.toString(),
          },
        ],
      };

      // 2) Subimos el JSON a IPFS (nodo local)
      const client = await create("/ip4/127.0.0.1/tcp/5001/http");
      const result = await client.add(JSON.stringify(metadata));
      const metadataCid = result.cid.toString();

      // 3) Llamamos al contrato con el CID del JSON como tokenURI
      const tx = await contract.contributeAndMint(metadataCid, { value });
      await tx.wait();

      alert("¡Contribución realizada! Tu NFT se ha minteado con metadatos personalizados.");
      refreshInfo();
    } catch (e) {
      console.error(e);
      alert("Error al contribuir");
    }
  };

  // Solicitar reembolso (refund)
  const refundHandler = async () => {
    const contract = contractRef.current;

    if (!contract) {
      alert("Conecta la wallet primero");
      return;
    }

    try {
      const tx = await contract.refund();
      await tx.wait();
      alert("Reembolso realizado correctamente.");
      refreshInfo();
    } catch (err) {
      console.error(err);
      alert(
        "No se pudo procesar el reembolso. Comprueba que la campaña haya finalizado, que no se alcanzara la meta y que hayas contribuido."
      );
    }
  };

  // Retirar fondos (owner, goal alcanzado)
  const withdrawHandler = async () => {
    const contract = contractRef.current;

    if (!contract) {
      alert("Conecta la wallet primero");
      return;
    }

    try {
      const tx = await contract.withdrawFunds();
      await tx.wait();
      alert("Fondos retirados correctamente por el owner.");
      refreshInfo();
    } catch (err) {
      console.error(err);
      alert(
        "No se pudo retirar los fondos. Comprueba que se haya alcanzado el goal y que seas el owner."
      );
    }
  };

  // Subir IPFS de archivo de campaña (owner)
  const setCampaignIPFSHandler = async () => {
    if (!file) {
      alert("Primero selecciona un archivo");
      return;
    }

    const contract = contractRef.current;
    if (!contract) {
      alert("Conecta la wallet antes de subir el archivo");
      return;
    }

    try {
      const client = await create("/ip4/127.0.0.1/tcp/5001/http");
      const result = await client.add(file);

      // Copiamos a MFS (opcional, pero mantiene accesible el archivo)
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);

      const tx = await contract.setCampaignFile(result.cid.toString());
      await tx.wait();
      setCampaignIPFS(result.cid.toString());
      alert("Archivo de campaña subido correctamente!");
    } catch (err) {
      console.error(err);
      alert("Error al subir archivo");
    }
  };

  // Leer archivo desde input
  const retrieveFile = (e) => {
    const data = e.target.files[0];
    if (!data) return;

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(Buffer.from(reader.result));
    };
    e.preventDefault();
  };

  // Convertir deadline a días/horas
  const calculateTimeLeft = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    let secondsLeft = deadline - now;
    if (secondsLeft <= 0) return "Finalizado";

    const days = Math.floor(secondsLeft / 86400);
    if (days > 0) return `${days} día(s)`;

    const hours = Math.floor(secondsLeft / 3600);
    return `${hours} hora(s)`;
  };

  useEffect(() => {
    ensureSepolia();
  }, []);

  // Lógica para refund:
  // - campaña finalizada
  // - total < goal
  // - myContribution > 0
  let canRefund = false;
  // Lógica para withdraw:
  // - total >= goal
  // - wallet === owner
  let canWithdraw = false;

  try {
    const totalBN = ethers.BigNumber.from(total === "-" ? "0" : total);
    const goalBN = ethers.BigNumber.from(goal === "-" ? "0" : goal);
    const mineBN = ethers.BigNumber.from(
      myContribution === "-" ? "0" : myContribution
    );

    canRefund =
      timeLeft === "Finalizado" &&
      totalBN.lt(goalBN) &&
      mineBN.gt(ethers.BigNumber.from(0));

    canWithdraw =
      totalBN.gte(goalBN) &&
      wallet &&
      owner &&
      wallet.toLowerCase() === owner.toLowerCase();
  } catch (e) {
    canRefund = false;
    canWithdraw = false;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Crowdfunding DApp NFT + IPFS</h1>

        <div>
          <button onClick={connectWallet}>Conectar MetaMask</button>
          <p>Conectado: {wallet}</p>
          {owner && (
            <p style={{ fontSize: "0.8rem" }}>
              Owner del contrato: {owner}
            </p>
          )}
        </div>

        <div className="card info">
          <h2>Información del Proyecto</h2>
          <p>Meta: {goal} WEI</p>
          <p>Total recaudado: {total} WEI</p>
          <p>Dinero restante: {moneyLeft} WEI</p>
          <p>Contribuidores: {contributorsCount}</p>
          <p>Tu contribución: {myContribution} WEI</p>
          <p>Tiempo restante: {timeLeft}</p>
          <p>IPFS del Proyecto (imagen base): {campaignIPFS}</p>
        </div>

        <div>
          <h2>Subir imagen/archivo de campaña a IPFS (owner)</h2>
          <input type="file" onChange={retrieveFile} />
          <button onClick={setCampaignIPFSHandler}>Subir</button>
        </div>

        <div>
          <h2>Contribuir en WEI y recibir NFT</h2>
          <input id="cantidadWEI" placeholder="Cantidad en WEI" />
          <button onClick={contributeNFT}>Contribuir</button>

          {myNFT && (
            <div style={{ marginTop: "20px" }}>
              <p>
                Tu NFT se ha minteado correctamente. Metadatos en IPFS:
              </p>
              <a href={myNFT} target="_blank" rel="noreferrer">
                {myNFT}
              </a>
              <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>
                (Es un JSON con el documento de la campaña, tu dirección y la cantidad donada en WEI)
              </p>
            </div>
          )}
        </div>

        {canRefund && (
          <div style={{ marginTop: "20px" }}>
            <h2>Reembolso</h2>
            <p>
              La campaña ha finalizado, no se alcanzó la meta y tú has contribuido.
              Puedes recuperar tu dinero.
            </p>
            <button onClick={refundHandler}>Solicitar reembolso</button>
          </div>
        )}

        {canWithdraw && (
          <div style={{ marginTop: "20px" }}>
            <h2>Retirar fondos (owner)</h2>
            <p>
              El objetivo de la campaña se ha alcanzado. Como owner, puedes retirar
              todos los fondos recaudados del contrato.
            </p>
            <button onClick={withdrawHandler}>Retirar fondos</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

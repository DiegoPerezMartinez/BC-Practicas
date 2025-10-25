let web3;
let account;
let contract;

// Dirección y ABI del contrato desplegado, necesario cambiar si se despliega en otra red o se modifica el contrato
const contractAddress = "0xC2f5E7e711E49E2c0828CABe7d3B266e25037Ee5";
const contractABI = [
	{
		"inputs": [],
		"name": "contribute",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "refund",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_goal",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_durationInDays",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Contribution",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Refund",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Withdraw",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "withdrawFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "contributions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "contributors",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "contributorsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deadline",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "goal",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "goalReached",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			}
		],
		"name": "isContributor",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "showContributor",
		"outputs": [
			{
				"internalType": "address",
				"name": "_contributor",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "money",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "showContributorsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "count",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "showGoal",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "showMoneyLeft",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "money",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "showMyContribution",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalContributed",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
async function connectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      contract = new web3.eth.Contract(contractABI, contractAddress);
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      document.getElementById("walletStatus").innerText = "Conectado: " + account;
      await refreshInfo();

    } catch (err) {
      console.error("Error al conectar MetaMask:", err);
      document.getElementById("walletStatus").innerText = "Error al conectar MetaMask.";
    }
  } else {
	alert("Por favor instala MetaMask");
  }
}


async function showGoal() {
    const goal = await contract.methods.showGoal().call();
    document.getElementById("infoStatus").innerText =
        "Meta de la campaña: " + goal + " WEI";
}

async function showMoneyLeft() {
    const money = await contract.methods.showMoneyLeft().call();
    document.getElementById("infoStatus").innerText =
        "Dinero restante para alcanzar la meta: " + money + " WEI";
}

async function showContributorsCount() {
    const contributors = await contract.methods.showContributorsCount().call();
    document.getElementById("infoStatus").innerText =
        "Número de contribuyentes actuales: " + contributors;
}

async function showMyContribution() {
    const money = await contract.methods.showMyContribution().call({ from: account });
    document.getElementById("infoStatus").innerText =
        "Has contribuido: " + money + " WEI";
}

async function showContributor() {
    const indice = document.getElementById("indice").value;
    if (indice === "" || isNaN(indice) || parseInt(indice) < 0) {
        document.getElementById("contributorStatus").innerText = "Introduce un índice válido";
        return;
    }

    try {
        const result = await contract.methods.showContributor(indice).call();
        document.getElementById("contributorStatus").innerText =
            `Contribuidor #${indice}: ${result._contributor} ha contribuido ${result.money} WEI`;
    } catch (err) {
        console.error("Error al consultar contribuidor:", err);
        document.getElementById("contributorStatus").innerText =
            "No existe ese contribuidor o hubo un error en la consulta.";
    }
}


async function contribute() {
    const amount = document.getElementById("cantidadWEI").value; // lo que escribió el usuario
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        document.getElementById("contributeStatus").innerText = "Introduce una cantidad válida en WEI";
        return;
    }
    const value = amount; // en WEI
    try {
        await contract.methods.contribute().send({ from: account, value: value });
        document.getElementById("contributeStatus").innerText =
            "Has contribuido " + amount + " WEI";
		await refreshInfo();
    } catch (err) {
        console.error("Error al contribuir:", err);
        document.getElementById("contributeStatus").innerText = "Error al enviar la contribución";
    }
}

async function withdraw() {
    try {
        await contract.methods.withdrawFunds().send({ from: account });
        document.getElementById("infoStatus").innerText =
            "Fondos retirados con éxito por el owner.";
		await refreshInfo();
    } catch (err) {
        console.error("Error al retirar fondos:", err);
        document.getElementById("infoStatus").innerText = "Error: No se pudo retirar.";
    }
}

let lastDaysLeft = null;

function updateDeadlineDisplay(deadline) {
    const now = Math.floor(Date.now() / 1000);
    let secondsLeft = deadline - now;
    if (secondsLeft <= 0) {
        document.getElementById("timeleft").innerText = "Finalizado";
        return;
    }
    let daysLeft = Math.floor(secondsLeft / 86400);
    if (daysLeft > 0) {
        if (daysLeft !== lastDaysLeft) {
            lastDaysLeft = daysLeft;
            document.getElementById("timeleft").innerText = `${daysLeft} día(s)`;
        }
    } else {
        const hoursLeft = Math.floor(secondsLeft / 3600);
        document.getElementById("timeleft").innerText = `${hoursLeft} hora(s)`;
    }
}


async function refreshInfo() {
  try {
    const goal = await contract.methods.showGoal().call();
    const total = await contract.methods.totalContributed().call();
    const left = await contract.methods.showMoneyLeft().call();
    const count = await contract.methods.showContributorsCount().call();
    const mine = await contract.methods.showMyContribution().call({ from: account });
	const deadline = await contract.methods.deadline().call();

    document.getElementById("goal").innerText = goal;
    document.getElementById("total").innerText = total;
    document.getElementById("moneyLeft").innerText = left;
    document.getElementById("contributorsCount").innerText = count;
    document.getElementById("myContribution").innerText = mine;
	updateDeadlineDisplay(deadline);
  } catch (err) {
    console.error("Error al actualizar información:", err);
  }
}

setInterval(async () => {
    if (contract) {
        const deadline = await contract.methods.deadline().call();
        updateDeadlineDisplay(deadline);
    }
}, 3600000);

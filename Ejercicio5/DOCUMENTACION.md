# Proyecto: Crowdfunding Smart Contract

**Autor:** Martín Alonso Pérez, Diego Pérez Martínez 
**Asignatura:** Tecnologías de Registro Distribuido y Blockchain  
**Fecha:** 27/10/2025

## 1. Análisis y definición del escenario

### Objetivo
Construir un contrato inteligente en Ethereum (red de pruebas Sepolia) que gestione campañas de crowdfunding con las siguientes características:
- Definir una meta (`goal`) en wei y duración en días.
- Permitir contribuciones de usuarios (payable).
- Permitir retirada de fondos por el owner si la meta se alcanza.
- Permitir reembolsos individuales a contribuyentes si la meta no se alcanza al finalizar la campaña.

### Justificación del uso de blockchain pública
- Necesidad de transparencia (todas las aportaciones y retiros son públicas).
- Necesidad de ejecución autónoma e inmutable de las reglas (p. ej. reembolsos y retiros).
- Uso de ETH real (a través de testnet) hace la prueba coherente.

## 2. Diseño

### Entidades y datos principales
- `owner`: address del creador de la campaña.
- `goal`: objetivo en wei.
- `deadline`: timestamp final.
- `totalContributed`: suma acumulada de contribuciones.
- `contributions`: mapping de address => cantidad aportada.
- `contributors` y `contributorsCount` (opcional) para enumeración.

### Funciones
- `constructor(uint _goal, uint _durationInDays)`
- `contribute()` payable — añade contribución y emite evento `Contribution`.
- `withdrawFunds()` — solo owner, solo si `goalReached`, emite `Withdraw`.
- `refund()` — reembolsa `contributions[msg.sender]` si campaña falló.
- Vistas: `showGoal()`, `showMoneyLeft()`, `showContributorsCount()`, `showMyContribution()`.

### Eventos
- `event Contribution(address indexed contributor, uint amount);`
- `event Refund(address indexed contributor, uint amount);`
- `event Withdraw(address indexed owner, uint amount);`

## 3. Implementación
- Lenguaje: Solidity ^0.8.0
- Archivo principal: `Crowdfunding.sol`


## 4. Pruebas
### 4.1 Pruebas manuales en Remix (pasos)
1. Abrir `Crowdfunding.sol` en Remix y compilar.
2. Conectar MetaMask en Sepolia en `Deploy & Run Transactions`.
3. Deploy con parámetros ejemplo: `_goal = 1000000000000000000` (1 ETH), `_durationInDays = 7`.
4. Contribuir con varias cuentas (usar MetaMask con varias cuentas) y verificar `totalContributed`, `showMyContribution()`.
5. Simular finalización: aumentar tiempo o desplegar con `duration = 0`, probar `refund()`.
6. Cumplir objetivo y que el owner ejecute `withdrawFunds()`.

## 5. Integración frontend
- Frontend básico con Web3.js (`frontend.js`) y `index.html` que permite:
  - Conectar MetaMask.
  - Ver información general (`goal`, `totalContributed`, `moneyLeft`, `contributorsCount`, `myContribution`).
  - Contribuir y ver respuesta inmediata.
  - Consultar contribuyentes por índice.

## 6. Archivos entregados
- `contracts/Crowdfunding.sol` — contrato implemetado.
- `frontend/*` — archivos HTML/CSS/JS para interactuar con el contrato.
- `DOCUMENTACION.md` — este documento.



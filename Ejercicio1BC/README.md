# TokenContract

Contrato inteligente en Solidity para administrar tokens que pueden ser transferidos y comprados con Ether.

## 📌 Características
- El propietario comienza con 100 tokens.
- Los usuarios pueden registrarse con un nombre.
- Los usuarios pueden comprar tokens (1 token cuesta **5 Ether**).
- El propietario puede transferir tokens y retirar el Ether acumulado.
- Se puede consultar el balance de tokens de cualquier usuario y el balance de Ether del contrato.

## ⚙️ Requisitos
- [Remix IDE](https://remix.ethereum.org/) o un entorno local con `solc` y `hardhat`.
- Versión de compilador: `0.8.30`.

## 🚀 Cómo usarlo en Remix
1. Abre [Remix IDE](https://remix.ethereum.org/).
2. Crea un archivo `TokenContract.sol` y pega el contenido del contrato desde `contracts/`.
3. Compila con la versión `0.8.30`.
4. Despliega el contrato en `Remix VM (London)`.
5. Usa la función `users(address)` para comprobar los tokens del propietario (deberían ser 100).
6. Cambia de cuenta y ejecuta `buyTokens(amount)` enviando Ether desde el campo **Value**.
7. Consulta `contractBalance()` para ver cuánto Ether tiene el contrato.
8. El propietario puede ejecutar `withdraw()` para retirar los fondos.

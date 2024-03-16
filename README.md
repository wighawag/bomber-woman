<p align="center">
  <a href="https://bomber-woman.world">
    <img src="docs/public/icon.png" alt="Bomber Woman Logo" width="500">
  </a>
</p>
<p align="center">
  <a href="https://github.com/wighawag/bomber-woman">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/wighawag/bomber-woman">
  </a>
  <a href="https://github.com/wighawag/bomber-woman/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/wighawag/bomber-woman.svg">
  </a>
  <a href="https://github.com/wighawag/bomber-woman/issues">
    <img alt="open issues" src="https://isitmaintained.com/badge/open/wighawag/bomber-woman.svg">
  </a>
</p>

---

# 👾🌍 BomberMan on-chain


## 💻 Install

> We are assuming here that you have [nodejs](https://nodejs.org/en) and [pnpm](https://pnpm.io/) installed
>
> We also recommend to install [zellij](https://zellij.dev/)

1. Clone the repository

   > Before cloning you will need to have [git LFS (Large File Storage)](https://git-lfs.com/) installed

   ```
   git clone https://github.com/wighawag/bomberWoman.git
   cd bomberWoman
   ```

   Then, ensure the LFS hooks are present:

   ```sh
   git lfs install
   ```

   > If you installed git lfs after already cloning the repo, you will also need to execute the following:

   ```sh
   git lfs pull
   ```

2. Install dependencies

   ```bash
   pnpm i
   ```

3. Then Assuming you have [zellij](https://zellij.dev/) installed

   ```bash
   pnpm start
   ```

   **And you are ready to go!**

> **Note** If you do not have [zellij](https://zellij.dev/) (on windows for example) you can use [wezterm](https://wezfurlong.org/wezterm/index.html)
>
> ```bash
> pnpm start:wezterm
> ```
>
> Or you can also launch each component in their own process
>
> ```bash
> pnpm local_node
> ```
>
> ```bash
> pnpm contracts:compile:watch
> ```
>
> ```bash
> pnpm contracts:deploy:watch
> ```
>
> ```bash
> pnpm indexer:dev
> ```
>
> ```bash
> pnpm web:dev
> ```

## 👾 Play

Just navigate to the url mentioned in the console. If you have no other thing running, it should be [http://localhost:5173/]()

## Deploying to a network

Just execute the following

```bash
pnpm contracts:deploy:prepare <network>
```

and it will ask you few questions and get your .env.local setup with the var needed to deploy on the network of your choice.

You just need to have a endpoint url and mnemonic ready for it.

You can of course configure it manually with more option if you need

Then you can deploy your contract

```bash
pnpm contracts:deploy <network>
```

And you can verify the contract

- on etherscan:

```bash
pnpm contracts:verify <network> etherscan
```

- using sourcify:

```bash
pnpm contracts:verify <network> sourcify
```

for etherscan if the network is not supported by default (no endpoint), you can provide your own:

```bash
pnpm contracts:verify <network> etherscan --endpoint <api endpoint url>
```


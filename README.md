# React Vite Actions

Sample code for:
React + Vite + Github Actions

automatically deploy react project to github pages

## For new project
1. Change PROJECT_BASENAME in vite.config.js

TODO: automate


## Frontend Environment
React + Typescript + Vite + TailwindCSS

```bash
./make_env.sh
```

```bash
./login_frontend.sh
```
docker内で
```bash
npm i
```

## Development
frontend
```bash
./login_frontend.sh
npm i
npm run dev
```

backend
```bash
./login_backend.sh
npm i
npm run dev
```

## Environment Setup

Dockerのインストール
[Qiita](https://qiita.com/yoshiyasu1111/items/17d9d928ceebb1f1d26d)
[公式](https://docs.docker.com/engine/install/ubuntu/)

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Dockerをnon-rootで実行するための設定 [参照](https://docs.docker.com/engine/install/linux-postinstall/)

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```
PC 再起動

インストール確認
```bash
docker run hello-world
```


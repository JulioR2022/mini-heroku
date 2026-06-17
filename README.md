<h1 align="center"> Mini-Heroku</h1>

<p align="center">
  <i>Uma plataforma PaaS (Platform as a Service) leve inspirada no Heroku.</i>
</p>

---

## Sobre o Projeto

O **Mini-Heroku** é um projeto Fullstack & DevOps focado em automatizar o gerenciamento e o deploy de aplicações através de containers Docker. O objetivo é simular a experiência de deploy simples e rápido de plataformas como o Heroku, rodando de forma local ou em servidores privados.

Através de uma interface web, o usuário pode interagir com um backend robusto que se comunica diretamente com o **Docker Daemon**, subindo containers, coletando logs em tempo real e gerenciando o ciclo de vida das aplicações.

## Principais Funcionalidades

- **Orquestração de Containers:** Inicialização, monitoramento (logs) e destruição de containers Docker de forma automatizada via Python.
- **Autenticação Segura:** Sistema de login com tokens JWT, protegendo rotas REST e conexões via WebSockets.
- **Banco de Dados Relacional:** Integração limpa com PostgreSQL utilizando SQLAlchemy para persistência de dados dos usuários e das instâncias.
- **Frontend Escalável:** Interface construída sobre um ecossistema Node.js com TypeScript, garantindo tipagem estática e manutenção simplificada.

## Tecnologias Utilizadas

### Backend (Motor de Deploy & API)
- **[Python 3](https://www.python.org/)** & **[FastAPI](https://fastapi.tiangolo.com/):** Alta performance para as rotas da API e WebSockets.
- **[Docker SDK for Python](https://docker-py.readthedocs.io/):** Controle direto do daemon do Docker (`docker.from_env()`).
- **PostgreSQL & SQLAlchemy:** Gerenciamento e ORM do banco de dados.
- **Passlib & Bcrypt:** Hashing de senhas e segurança.

### Frontend
- **Node.js & TypeScript:** Base do ecossistema do cliente web para uma experiência tipada e segura.
---

## Como Executar Localmente

### Pré-requisitos
- **Docker** instalado na sua máquina.

### Passos para execução

1. Clone o repositório e acesse a pasta do projeto.
2. Na raiz do projeto, suba todos os serviços executando:
   ```bash
   docker compose up -d
   ```
3. Aguarde a inicialização dos containers e acesse a interface web através do seu navegador.

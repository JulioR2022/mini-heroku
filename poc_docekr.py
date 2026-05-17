import docker
import time

def main():
    print('1. Conectando ao Daemon do Docker')

    # Le as variaveis de ambiente para achar e se conectar
    # ao daemon local do docker
    client = docker.from_env()

    print('# Conexão bem sucedida')
    container_name = 'mini-heroku'
    try:
        # Pega o container antigo
        old = client.containers.get(container_name)
        # So resolve esse print se achar um container como mesmo
        # nome que o estamos criando
        print("Limpando container antigo")
        old.remove(force=True)
    except docker.errors.NotFound:
        pass

    print("2. Iniciando um novo container")
    # docker run => client.containers.run()
    container = client.containers.run(
        'nginx:alpine', # imagem
        detach= True, # Roda em background
        name= container_name, # nome do container
        ports= {'80/tcp':8080} # Mapeia a porta 80 do container para a 8080 
    )

    container.reload()
    print(f'Status do container: {container.status}')

    print('Espera gerar Logs')
    time.sleep(5) # segundos

    print('3. Coletando logs')
    # container.logs retorna Bytes
    logs = container.logs().decode('utf-8')
    print('#' * 40)
    print(logs if logs else 'Nenhum log foi gerado')
    print('#' * 40)

    print('5. Parando e removendo o container')
    container.stop()
    container.remove(force=True)
    print("Limpeza concluída! A PoC foi um sucesso.")





if __name__ == '__main__':
    main()
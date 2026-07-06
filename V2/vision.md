Um sistema de automação residencial modular, flexivel com assistente de IA

# Principais componentes:

    - Modulos
        São os modulos fisicos que captam os inputs como swith, button, voice, temperature e humadity e executam as ações como apagar, ascender, ligar, desligar, mudar cor de led, etc
    - Central
        Só uma central que pode disparar atualizações de firmware para os modules, atualizeções de configurações, descarrega os logs, amazerna em banco, etc
    - Assistent IA
        Uma API que pode receber texto ou voz, com acesso ao banco, pode mudar configurações, status, retornar status e dar assistencia geral ao usuário

# Framework
    Define o protocolo de comunicação e padrões a ser seguido por modulos, comunicações, etc

## Protocolo
    Deve ser minimo e bem performatico para poder trafegar em rede mesh wifi, com capacidade de um modulo conversar com outro modulo diretamente e também com a API da central e a API do assistente IA, além de permitir varios meios de transporte

# UseCase
    Modulos ESP32 espalhados pela casa formando uma rede Mesh Wifi, alguns contem apenas a funcionabilidade de switch generico, outros tem o switch generico e já controlador de lampada via rele, e outros são apenas modulos reles instalado perto dos bocais da lampada para controlar apenas uma lampada e calcular seu consumo, além de modulos com display toch contrlados por Raspbery para oferecer mais funcionalidades de controle
    Um modulo ESP32 especial faz a ponte entre um wifi comum e a rede mesh
    Um computador rodando a central e o assistent IA com modelos LLM ollama local
    


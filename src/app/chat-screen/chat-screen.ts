import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

interface IChat {

  chatTitle: string;
  id: number;
  userId: string;

}

interface IMessage {

  chatId: number;
  id: number;
  text: string;
  userId: string;

}

@Component({
  selector: 'app-chat-screen',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat-screen.html',
  styleUrl: './chat-screen.css'
})
export class ChatScreen {

  chats: IChat[];
  chatSelecionado: IChat;
  mensagens: IMessage[];
  mensagemUsuario = new FormControl(""); // Declaramos e atribuimos valor.

  constructor (private http: HttpClient, private cd: ChangeDetectorRef) { // Constrói a classe
    // Inicialização de variáveis...
    this.chats = [];
    this.chatSelecionado = null!;
    this.mensagens = [];
  }

  ngOnInit() { // Executado quando o Angular está pronto para rodar
    // Buscar dados da API.

    this.getChats();

  }

  // Vai na API e busca os chats.
  async getChats () {
    // Método que busca os chats da API.
    let response = await firstValueFrom(this.http.get("https://senai-gpt-api.azurewebsites.net/chats", {
      headers: {
        "Authorization" : "Bearer " + localStorage.getItem("meuToken")
      }
    })) as IChat[];

    if (response) {
      
      console.log("CHATS", response);
      
      // Busca o ID do usuário logado do localstorage
      let userId = localStorage.getItem("meuId");

      // Filtra os chats - Somente os chats do usuário logado serão mostrados.
      response = response.filter(chat => chat.userId == userId);

      // Mostra os chats na tela
      this.chats = response as [];
    
    } else {
      
      console.log("Erro ao buscar os chats.");

    }

    this.cd.detectChanges(); // Força uma atualização na tela.

  }

  async onChatClick (chatClicado: IChat) {

    console.log("Chat Clicado", chatClicado);

    this.chatSelecionado = chatClicado;

    // Lógica para buscar as mensagens.
    let response = await firstValueFrom(this.http.get("https://senai-gpt-api.azurewebsites.net/messages?chatId=" + chatClicado.id, {
      headers: {
        "Authorization" : "Bearer " + localStorage.getItem("meuToken")
      }
    }));

    console.log("MENSAGENS", response);

    this.mensagens = response as IMessage[];

    this.cd.detectChanges();

  }

  async enviarMensagem () {

    debugger;

    let novaMensagemUsuario = {

      // id
      chatId: this.chatSelecionado.id,
      userId: localStorage.getItem("meuId"),
      text: this.mensagemUsuario.value

    };

    // 1 - Salva a mensagem do usuário no banco de dados
    let novaMensagemUsuarioResponse = await firstValueFrom(this.http.post("https://senai-gpt-api.azurewebsites.net/messages", novaMensagemUsuario, {
      headers: {
        "Content-Type": "application/json",
        "Authorization" : "Bearer " + localStorage.getItem("meuToken")
      }
    }));

    // Atualiza as mensagens da tela
    await this.onChatClick(this.chatSelecionado);

    // 2 - Enviar a mensagem do usuário para a IA responder
    let respostaIAResponse = await firstValueFrom(this.http.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      "contents": [
        {
          "parts": [
            {
              "text": this.mensagemUsuario.value + ". Me dê uma resposta objetiva."
            }
          ]
        }
      ]
    }, {
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": "AIzaSyDV2HECQZLpWJrqCKEbuq7TT5QPKKdLOdo"
      }
    })) as any;

    let novaRespostaIA = {
      chatId: this.chatSelecionado.id,
      userId: "chatbot",
      text:  respostaIAResponse.candidates[0].content.parts[0].text
      // id
    }

    // 3 - Salva a resposta da IA no banco de dados
    let novaRespostaIAResponse = await firstValueFrom(this.http.post("https://senai-gpt-api.azurewebsites.net/messages", novaRespostaIA, {
      headers: {
        "Content-Type": "application/json",
        "Authorization" : "Bearer " + localStorage.getItem("meuToken")
      }
    }));

    // Atualiza as mensagens da tela
    await this.onChatClick(this.chatSelecionado);

    // Limpa o campo de digitação
    this.mensagemUsuario.setValue("");

  }

  async novoChat() {

    const nomeChat = prompt("Digite o nome do novo chat:");

    if (!nomeChat) {
      // Caso o usuário deixe o campo vazio.

      alert("Nome inválido.");
      return; // Para a execução do método.

    }

    // Crio o objeto do chat
    const novoChatObj = {

      chatTitle: nomeChat,
      userId: localStorage.getItem("meuId")
      // id - O Backend irá gerar.

    }

    let novoChatResponse = await firstValueFrom(this.http.post("https://senai-gpt-api.azurewebsites.net/chats", novoChatObj, {
      headers: {
        "Content-Type": "application/json",
        Authorization : "Bearer " + localStorage.getItem("meuToken")
      }
    })) as IChat;

    // Atualiza os chats da tela
    await this.getChats();

    // Abre o chat recém criado
    await this.onChatClick(novoChatResponse);

  }

  deslogar() {

    // 1 alternativa
    localStorage.removeItem("meuToken");
    localStorage.removeItem("meuId");

    // 2 alternativa
    localStorage.clear();

    window.location.href = "login";

  }

  async deletarChatSelecionado () {

    let confirmation = confirm("Deseja reealmente apagar o chat " + this.chatSelecionado.chatTitle + "?");

    if (!confirmation) {

      return;

    }

    try {
      
      let deleteResponse = await firstValueFrom(this.http.delete("https://senai-gpt-api.azurewebsites.net/chats/" + this.chatSelecionado.id, {
        headers: {
          "Content-Type": "application/json",
          Authorization : "Bearer " + localStorage.getItem("meuToken")
        }
      })) as IChat;

    } catch (error) {
      
      console.log("Erro no delete: " + error);

    }

    // Atualiza os chats do menu lateral.
    await this.getChats();

    // Remove o chat clicado, limpando a tela
    this.chatSelecionado = null!;

    // Força a atualização da tela
    this.cd.detectChanges();

  }

}

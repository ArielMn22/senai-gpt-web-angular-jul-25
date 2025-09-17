import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

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
  imports: [CommonModule],
  templateUrl: './chat-screen.html',
  styleUrl: './chat-screen.css'
})
export class ChatScreen {

  chats: IChat[];
  chatSelecionado: IChat;
  mensagens: IMessage[];

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

  async getChats () {
    // Método que busca os chats da API.
    let response = await firstValueFrom(this.http.get("https://senai-gpt-api.azurewebsites.net/chats", {
      headers: {
        "Authorization" : "Bearer " + localStorage.getItem("meuToken")
      }
    }));

    if (response) {
      
      console.log("CHATS", response);
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

  }

}

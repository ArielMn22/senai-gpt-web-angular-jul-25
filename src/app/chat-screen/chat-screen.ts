import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IChat {

  chatTitle: string;
  id: number;
  userId: string;

}

@Component({
  selector: 'app-chat-screen',
  imports: [HttpClientModule, CommonModule],
  templateUrl: './chat-screen.html',
  styleUrl: './chat-screen.css'
})
export class ChatScreen {

  chats: IChat[];

  constructor (private http: HttpClient) { // Constrói a classe
    // Inicialização de variáveis...
    this.chats = [];
  }

  ngOnInit() { // Executado quando o Angular está pronto para rodar
    // Buscar dados da API.

    this.getChats();

  }

  async getChats () {
    // Método que busca os chats da API.
    let response = await this.http.get("https://senai-gpt-api.azurewebsites.net/chats", {
      headers: {
        "Authorization" : "Bearer " + localStorage.getItem("meuToken")
      }
    }).toPromise();

    if (response) {
      
      console.log("CHATS", response);
      this.chats = response as [];
    
    } else {
      
      console.log("Erro ao buscar os chats.");

    }

  }

}

// Um desenvolvedor tentou criar um projeto que consome a base de dados de filme do TMDB para criar um organizador de filmes, mas desistiu
// pois considerou o seu código inviável. Você consegue usar typescript para organizar esse código e a partir daí aprimorar o que foi feito?

// A ideia dessa atividade é criar um aplicativo que:
//    - Busca filmes
//    - Apresenta uma lista com os resultados pesquisados
//    - Permite a criação de listas de filmes e a posterior adição de filmes nela

// Todas as requisições necessárias para as atividades acima já estão prontas, mas a implementação delas ficou pela metade (não vou dar tudo de graça).
// Atenção para o listener do botão login-button que devolve o sessionID do usuário
// É necessário fazer um cadastro no https://www.themoviedb.org/ e seguir a documentação do site para entender como gera uma API key https://developers.themoviedb.org/3/getting-started/introduction

var apiKey = "";
//let apiKey;
let requestToken: string;
let username: string;
let password: string;
let sessionId: string;
let listId: number;

interface IRequestToken {
  success: boolean;
  expires_at: string;
  request_token: string;
}

type ResultMovie = {
  id: number;
  original_title: string;
};

let loginButton = document.getElementById("login-button")! as HTMLButtonElement;
let searchButton = document.getElementById(
  "search-button"
)! as HTMLButtonElement;
let searchContainer = document.getElementById("search-container")!;

let btnCriarLista = document.getElementById(
  "btn-criar-lista"
)! as HTMLButtonElement;

loginButton.addEventListener("click", async () => {
  await criarRequestToken();
  await logar();
  await criarSessao();
});

btnCriarLista.addEventListener("click", async () => {
  let inputNomeLista = document.getElementById(
    "nome-lista"
  )! as HTMLInputElement;
  let inputDescricaoLista = document.getElementById(
    "descricao-lista"
  )! as HTMLTextAreaElement;
  let nome = inputNomeLista.value;
  let descricao = inputDescricaoLista.value;

  await criarLista(nome, descricao);
});

searchButton.addEventListener("click", async () => {
  let lista = document.getElementById("lista");
  if (lista) {
    lista.outerHTML = "";
  }

  let inputSearch = document.getElementById("search") as HTMLInputElement;
  let query = inputSearch.value;
  let listaDeFilmes = await procurarFilme(query);
  let ul = document.createElement("ul");
  ul.id = "lista";

  for (const item of listaDeFilmes.results) {
    let btnAdd = document.createElement("button");
    btnAdd.innerHTML = "+";
    btnAdd.onclick = function () {
      adicionarFilmeNaLista(item.id, listId);
    };

    let li = document.createElement("li");
    li.appendChild(document.createTextNode(item.original_title));
    li.appendChild(btnAdd);
    ul.appendChild(li);
  }
  searchContainer.appendChild(ul);
});

function preencherSenha() {
  let inputSenha = document.getElementById("senha")! as HTMLInputElement;
  password = inputSenha.value;
  validateLoginButton();
}

function preencherLogin() {
  let inputLogin = document.getElementById("login")! as HTMLInputElement;
  username = inputLogin.value;
  validateLoginButton();
}

function preencherApi() {
  let inputApiKey = document.getElementById("api-key")! as HTMLInputElement;
  apiKey = inputApiKey.value;
  validateLoginButton();
}

function validateLoginButton() {
  if (password && username && apiKey) {
    loginButton.disabled = false;
  } else {
    loginButton.disabled = true;
  }
}

class HttpClient {
  static async get<T>({
    url,
    method,
    body = null,
  }: {
    url: string;
    method: string;
    body?: any;
  }) {
    return new Promise<T>((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open(method, url, true);

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject({
            status: request.status,
            statusText: request.statusText,
          });
        }
      };
      request.onerror = () => {
        reject({
          status: request.status,
          statusText: request.statusText,
        });
      };

      if (body) {
        request.setRequestHeader(
          "Content-Type",
          "application/json;charset=UTF-8"
        );
        body = JSON.stringify(body);
      }
      request.send(body);
    });
  }
}

async function procurarFilme(query: string) {
  query = encodeURI(query);
  let result = await HttpClient.get<{ results: Array<ResultMovie> }>({
    url: `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
    method: "GET",
  });
  return result;
}

async function adicionarFilme(filmeId: string) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=en-US`,
    method: "GET",
  });
}

async function criarRequestToken() {
  let result = await HttpClient.get<IRequestToken>({
    url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${apiKey}`,
    method: "GET",
  });
  requestToken = result.request_token;
}

async function logar() {
  await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${apiKey}`,
    method: "POST",
    body: {
      username: `${username}`,
      password: `${password}`,
      request_token: `${requestToken}`,
    },
  });
}

async function criarSessao() {
  let result = await HttpClient.get<{ success: boolean; session_id: string }>({
    url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${apiKey}&request_token=${requestToken}`,
    method: "GET",
  });
  sessionId = result.session_id;
}

async function criarLista(nomeDaLista: string, descricao: string) {
  let result = await HttpClient.get<{
    status_message: string;
    list_id: number;
  }>({
    url: `https://api.themoviedb.org/3/list?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      name: nomeDaLista,
      description: descricao,
      language: "pt-br",
    },
  });
  listId = result.list_id;
}

async function adicionarFilmeNaLista(
  filmeId: number,
  listaId: string | number
) {
  if (listId) {
    let result = await HttpClient.get({
      url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${apiKey}&session_id=${sessionId}`,
      method: "POST",
      body: {
        media_id: filmeId,
      },
    });
    pegarLista();
  }
}

async function pegarLista() {
  let result = await HttpClient.get<{
    name: string;
    description: string;
    items: [{ original_title: string }];
  }>({
    url: `https://api.themoviedb.org/3/list/${listId}?api_key=${apiKey}`,
    method: "GET",
  });

  let inputNome = document.getElementById("nome")! as HTMLParagraphElement;
  let inputDescricao = document.getElementById(
    "descricao"
  )! as HTMLParagraphElement;

  let listaContainer = document.getElementById("lista-container")!;

  inputNome.innerHTML = "Nome: " + result.name;
  inputDescricao.innerHTML = "Descrição: " + result.description;

  let listaItemsFilme = document.getElementById("lista-items-filme")!;
  if (listaItemsFilme) {
    listaItemsFilme.outerHTML = "";
  }
  let ul = document.createElement("ul");
  ul.id = "lista-items-filme";

  for (let lista of result.items) {
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(lista.original_title));
    ul.appendChild(li);
  }
  listaContainer.appendChild(ul);
}

/*<div style="display: flex;">
        <div style="display: flex; width: 300px; height: 100px; justify-content: space-between; flex-direction: column;">
            <input id="login" placeholder="Login" onchange="preencherLogin(event)">
            <input id="senha" placeholder="Senha" type="password" onchange="preencherSenha(event)">
            <input id="api-key" placeholder="Api Key" onchange="preencherApi()">
            <button id="login-button" disabled>Login</button>
        </div>
        <div id="search-container" style="margin-left: 20px">
            <input id="search" placeholder="Escreva...">
            <button id="search-button">Pesquisar Filme</button>
        </div>
    </div>
    <hr />
    <div style="display: flex;">
        <div id="lista-container" style="display: flex; width: 300px; height: 100px; justify-content: space-between; flex-direction: column;">
            <h2>Listas Criadas</h2>
            <p id="nome"></p>
            <p id="descricao"></p>
        </div>
        <hr style="margin: 0 8%;" />
        <div style="display: flex; justify-content: space-between; flex-direction: column;">
            <h2>Criar Lista</h2>
            <input id="nome-lista" type="text" placeholder="Digite o nome da lista..." />
            <textarea name="descricao-lista" id="descricao-lista" placeholder="Digite a descricao da lista..." cols="30" rows="5" maxlength="100"></textarea>
            <button id="btn-criar-lista">Criar Lista</button>
        </div>
    </div>*/

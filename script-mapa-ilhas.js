// Função de alerta customizado (Reutilizada do script-app.js e script-login.js)
const showCustomAlert = (message, type = 'success', duration = 3000) => {
    const container = document.getElementById('custom-alert-container');
    if (!container) {
        console.warn('Container de alerta customizado não encontrado, usando alert() padrão.');
        alert(message);
        return;
    }

    const alertElement = document.createElement('div');
    alertElement.className = `custom-alert ${type}`;
    alertElement.textContent = message;

    container.appendChild(alertElement);

    void alertElement.offsetWidth; 
    alertElement.classList.add('show');

    setTimeout(() => {
        alertElement.classList.remove('show');
        alertElement.addEventListener('transitionend', () => {
            alertElement.remove();
        });
    }, duration);
};

// Função para mostrar modais genéricos
const showModal = (modalId) => {
    document.getElementById(modalId).style.display = "flex"
}

// Função para esconder modais genéricos
const hideModal = (modalId) => {
    document.getElementById(modalId).style.display = "none"
}

// Função para substituir o prompt() nativo
const customPrompt = (message, defaultValue = '', maxLength = 10) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-prompt-modal');
        const msgElement = document.getElementById('custom-prompt-message');
        const inputElement = document.getElementById('custom-prompt-input');
        const okBtn = document.getElementById('custom-prompt-ok');
        const cancelBtn = document.getElementById('custom-prompt-cancel');

        msgElement.textContent = message;
        inputElement.value = defaultValue;
        inputElement.maxLength = maxLength;
        modal.style.display = 'flex';
        inputElement.focus();

        const handleOk = () => {
            modal.style.display = 'none';
            resolve(inputElement.value.trim() === '' ? null : inputElement.value);
            cleanup();
        };

        const handleCancel = () => {
            modal.style.display = 'none';
            resolve(null); // Retorna null como o prompt nativo faria
            cleanup();
        };

        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);

        // Permite fechar com a tecla Enter
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleOk();
            }
        });
    });
};

// Função para substituir o confirm() nativo
const customConfirm = (message) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgElement = document.getElementById('custom-confirm-message');
        const yesBtn = document.getElementById('custom-confirm-yes');
        const noBtn = document.getElementById('custom-confirm-no');

        msgElement.textContent = message;
        modal.style.display = 'flex';

        const handleYes = () => {
            modal.style.display = 'none';
            resolve(true);
            cleanup();
        };

        const handleNo = () => {
            modal.style.display = 'none';
            resolve(false);
            cleanup();
        };
        
        const cleanup = () => {
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
        };

        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
    });
};

// CORRIGIDO: Mapa para associar o sentimento ao prefixo do nome do arquivo (agora incluindo 'da' e 'do')
const SENTIMENT_TO_PREFIX = {
    'Felicidade': 'Ilhadafelicidade',
    'Amor': 'Ilhadoamor',
    'Tristeza': 'Ilhadatristeza',
    'Raiva': 'Ilhadaraiva',
    'Nostalgia': 'Ilhadanostalgia'
};


document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menu-btn")
  const sidebar = document.getElementById("sidebar")
  const logoutBtn = document.getElementById("logout-btn")
  const greetingElement = document.getElementById("greeting")
  const albumsList = document.getElementById("albums-list")
  const createAlbumLink = document.getElementById("create-album-link")
  const islandsMapContainer = document.getElementById("islands-map-container")
  const addMemoryBtn = document.getElementById("add-memory-btn")
  const closeBtns = document.querySelectorAll(".close-btn")


  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"))
  if (!loggedInUser) {
    window.location.href = "index.html"
    return
  }

  let albums = []
  let sentimentCounts = {} // Objeto para armazenar as contagens dinamicamente
  const API_URL = "http://localhost:3000"


  const fetchAlbums = async () => {
    try {
      const response = await fetch(`${API_URL}/albums/${loggedInUser.id}`)
      albums = await response.json()
      renderAlbums()
    } catch (error) {
      console.error("Erro ao carregar álbuns:", error)
      showCustomAlert("Erro ao carregar álbuns.", 'error', 5000);
    }
  }

  // Função para buscar as contagens de sentimentos
  const fetchSentimentCounts = async () => {
    try {
        const response = await fetch(`${API_URL}/sentiments/${loggedInUser.id}`)
        const data = await response.json()
        
        // Converte o array de objetos em um mapa para fácil acesso (ex: counts['Felicidade'] = 5)
        sentimentCounts = data.reduce((acc, current) => {
            acc[current.sentiment] = Number(current.count);
            return acc;
        }, {});

        renderSentimentCounts();

    } catch (error) {
        console.error("Erro ao carregar contagens de sentimentos:", error);
        showCustomAlert("Erro ao carregar contagens de sentimentos.", 'error', 5000);
    }
  };
  
  // ATUALIZADO: Função para renderizar as contagens no HTML e atualizar as imagens
  const renderSentimentCounts = () => {
      // Seleciona todos os spans que devem exibir a contagem
      const sentimentElements = document.querySelectorAll('.sentiment-count');
      
      sentimentElements.forEach(element => {
          const sentiment = element.dataset.sentiment;
          const count = sentimentCounts[sentiment] || 0; // Obtém a contagem ou 0 se não houver
          element.textContent = `(${count})`;

          const islandItem = element.closest('.island-item');
          if (!islandItem) return;

          // Seleciona o elemento <img> dentro do island-item
          const imageElement = islandItem.querySelector('.island-image');
          if (!imageElement) return;

          // Lógica para determinar o Nível da Ilha (1-5: N1, 6-15: N2, 16-25: N3, >25: N4)
          let level = 1;
          if (count > 25) {
              level = 4;
          } else if (count > 15) {
              level = 3;
          } else if (count > 5) {
              level = 2;
          }
          // Se count for 0 a 5, level permanece 1.

          // Mapeia o sentimento para o prefixo do nome do arquivo
          const imagePrefix = SENTIMENT_TO_PREFIX[sentiment];
          
          if (imagePrefix) {
              // Constrói o novo caminho da imagem com o prefixo CORRETO e o nível
              const newSrc = `img/${imagePrefix}${level}.png`;
              imageElement.src = newSrc;
          }


          // Lógica para adicionar uma classe de destaque (mantida)
          if (count > 0) {
              islandItem.classList.add('has-memories'); 
          } else {
              islandItem.classList.remove('has-memories');
          }
      });
  }


  const renderAlbums = () => {
    albumsList.innerHTML = ""
    albums.forEach((album) => {
      const li = document.createElement("li")
      li.className = "album-item-container"
      li.innerHTML = `
                <a href="app.html#album-${album.id}" class="menu-item album-item" data-id="${album.id}">
                    <span class="material-icons">folder</span> ${album.title}
                </a>
                <div class="album-actions">
                    <button class="icon-btn edit-album-btn" data-id="${album.id}"><span class="material-icons">edit</span></button>
                    <button class="icon-btn delete-album-btn" data-id="${album.id}"><span class="material-icons">delete</span></button>
                </div>
            `
      albumsList.appendChild(li)
    })
  }
  
  // A renderização de ilhas foi removida para usar o HTML estático.
  // const renderIslands = (data) => { ... } // Comentado/Removido como no código original

  // Eventos

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser")
    window.location.href = "index.html"
  })

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show")
  })
  
  // Lógica de Criar Álbum atualizada para usar customPrompt
  createAlbumLink.addEventListener("click", async (e) => {
    e.preventDefault()
    const albumTitle = await customPrompt("Digite o título do novo álbum:")

    if (albumTitle) {
      try {
        const response = await fetch(`${API_URL}/albums`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: albumTitle, userId: loggedInUser.id }),
        })
        if (response.ok) {
          showCustomAlert("Álbum criado com sucesso!", 'success');
          await fetchAlbums()
        } else {
          showCustomAlert("Erro ao criar álbum.", 'error');
        }
      } catch (error) {
        showCustomAlert("Erro ao conectar ao servidor.", 'error');
      }
    }
    sidebar.classList.remove("show")
  })

  // Lógica de Edição/Exclusão atualizada
  albumsList.addEventListener("click", async (e) => {
    const target = e.target.closest(".album-item");
    const editBtn = e.target.closest(".edit-album-btn");
    const deleteBtn = e.target.closest(".delete-album-btn");

    if (target) {
        e.preventDefault();
        window.location.href = target.href;
    }
    
    if (editBtn) {
      e.preventDefault()
      const albumId = editBtn.dataset.id
      const albumToEdit = albums.find((a) => a.id == albumId)
      const newTitle = await customPrompt("Digite o novo nome para o álbum:", albumToEdit.title)

      if (newTitle && newTitle.trim() !== "") {
        try {
          const response = await fetch(`${API_URL}/albums/${albumId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          })
          if (response.ok) {
            showCustomAlert("Nome do álbum alterado com sucesso!", 'success');
            await fetchAlbums()
          } else {
            showCustomAlert("Erro ao alterar nome do álbum.", 'error');
          }
        } catch (error) {
          showCustomAlert("Erro ao conectar ao servidor.", 'error');
        }
      }
    }

    if (deleteBtn) {
      e.preventDefault()
      const albumId = deleteBtn.dataset.id
      if (await customConfirm("Tem certeza que deseja excluir este álbum e todas as memórias associadas a ele?")) {
        try {
          const response = await fetch(`${API_URL}/albums/${albumId}`, { method: "DELETE" })
          if (response.ok) {
            showCustomAlert("Álbum excluído com sucesso!", 'success');
            await fetchAlbums()
          } else {
            showCustomAlert("Erro ao excluir álbum.", 'error');
          }
        } catch (error) {
          showCustomAlert("Erro ao conectar ao servidor.", 'error');
        }
      }
    }
  })

  // CORREÇÃO FINAL: Redireciona para app.html com um hash para abrir o modal.
  if (addMemoryBtn) {
      addMemoryBtn.addEventListener("click", (e) => {
          e.preventDefault(); 
          window.location.href = "app.html#add-memory"; 
      });
  }

  // Evento para fechar modais
  window.addEventListener("click", (e) => {
    if (e.target.id === "custom-confirm-modal") {
        hideModal("custom-confirm-modal");
    }
    if (e.target.id === "custom-prompt-modal") {
        hideModal("custom-prompt-modal");
    }
  });

  // Inicialização
  greetingElement.innerHTML = `Bem vindo,<br> <span class="user-name">${loggedInUser.name}!</span>`
  fetchAlbums()
  fetchSentimentCounts() // CHAMA A NOVA FUNÇÃO
})
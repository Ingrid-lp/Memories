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
  const API_URL = "http://localhost:3000"

  // Mapeamento de sentimentos e dados de exibição para as ilhas (Simplificado)
  const sentimentMap = {
      'Felicidade': { count: 0 }, 
      'Amor': { count: 0 },
      'Tristeza': { count: 0 },
      'Nostalgia': { count: 0 },
      'Raiva': { count: 0 },
  };


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

  // Função que apenas simula o carregamento (já que o HTML é estático)
  const fetchSentimentCounts = async () => {
    // Apenas garante que o script não tenta carregar dinamicamente, mantendo o HTML estático.
  };

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
  const renderIslands = (data) => {
      const mapContainer = document.getElementById('islands-map-container');
      // Nenhuma ação para manter o conteúdo estático do usuário.
  }

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
  fetchSentimentCounts()
})
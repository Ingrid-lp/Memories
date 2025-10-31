// --- FUNÇÕES DE DIÁLOGO CUSTOMIZADAS ---

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

const showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
}

const hideModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

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
            resolve(null);
            cleanup();
        };

        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);

        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleOk();
            }
        });
    });
};

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

// --- LÓGICA PRINCIPAL ---

document.addEventListener("DOMContentLoaded", () => {
  const greetingElement = document.getElementById("greeting")
  const memoriesContainer = document.getElementById("memories-container")
  const addMemoryBtn = document.getElementById("add-memory-btn")
  const memoryModal = document.getElementById("memory-modal")
  const memoryForm = document.getElementById("memory-form")
  const memoryIdInput = document.getElementById("memory-id")
  const memoryModalTitle = document.getElementById("modal-title")
  const logoutBtn = document.getElementById("logout-btn")
  const menuBtn = document.getElementById("menu-btn")
  const sidebar = document.getElementById("sidebar")
  const homeLink = document.getElementById("home-link")
  const createAlbumLink = document.getElementById("create-album-link")
  const mapaIlhasLink = document.getElementById("mapa-ilhas-link") 
  const albumsList = document.getElementById("albums-list")
  const contentTitle = document.getElementById("content-title")
  const emptyState = document.getElementById("empty-state")
  const addToAlbumModal = document.getElementById("add-to-album-modal")
  const memoriesToAddList = document.getElementById("memories-to-add-list")
  const addSelectedMemoriesBtn = document.getElementById("add-selected-memories-btn")
  const viewMemoryModal = document.getElementById("view-memory-modal")
  const viewMemoryContent = document.getElementById("view-memory-content")
  const imageUploadField = document.getElementById("image-upload-field")
  const memorySentimentInput = document.getElementById("memory-sentiment") 
  const closeBtns = document.querySelectorAll(".close-btn")


  // Elementos adicionados para o novo botão de adicionar ao álbum
  const addToAlbumBtnContainer = document.getElementById("add-to-album-btn-container")
  const addToAlbumBtn = document.getElementById("add-to-album-btn")

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"))
  if (!loggedInUser) {
    window.location.href = "index.html"
    return
  }
  
  // FUNÇÃO CENTRALIZADA PARA ABRIR O MODAL DE ADICIONAR MEMÓRIA
  const openAddMemoryModal = () => {
      memoryForm.reset();
      memorySentimentInput.value = "";
      imageUploadField.style.display = "block";
      const memoryImageInput = document.getElementById("memory-image");
      if (memoryImageInput) memoryImageInput.required = true;
      memoryIdInput.value = "";
      memoryModalTitle.textContent = "Adicionar Nova Memória";
      showModal("memory-modal");
  };

  // --- FUNÇÃO PARA ABRIR MODAL VIA HASH ---
  const checkHashForModal = () => {
    if (window.location.hash === '#add-memory') {
        openAddMemoryModal(); 
        history.replaceState(null, null, window.location.pathname); 
    }
  };

  window.addEventListener("load", () => {
    fetchData()
  })

  let memories = []
  let albums = []
  let currentAlbumId = null // ID do álbum que estamos visualizando

  const API_URL = "http://localhost:3000"

  // ATUALIZADO: Processa o campo albumIds do backend (GROUP_CONCAT)
  const fetchData = async () => {
    try {
      const memoriesResponse = await fetch(`${API_URL}/memories/${loggedInUser.id}`)
      let fetchedMemories = await memoriesResponse.json()
      
      // Processa a string de albumIds (retornada pelo GROUP_CONCAT) em um array de números
      memories = fetchedMemories.map(m => ({
          ...m,
          // Garante que albumIds é sempre um array de IDs (números)
          albumIds: m.albumIds ? m.albumIds : [] // Já deve vir como array se o backend for bem implementado, ou processa
      }));

      const albumsResponse = await fetch(`${API_URL}/albums/${loggedInUser.id}`)
      albums = await albumsResponse.json()

      renderScreen()
      checkHashForModal() 
    } catch (error) {
      showCustomAlert("Erro ao carregar dados do servidor. Certifique-se de que o servidor Node.js está rodando.", 'error')
      console.error("Fetch data error:", error)
    }
  }


  const updateAddMemoryButtons = () => {
    addMemoryBtn.style.display = "block"
    if (currentAlbumId) {
      addToAlbumBtnContainer.style.display = "block"
    } else {
      addToAlbumBtnContainer.style.display = "none"
    }
  }

  const renderScreen = () => {
    greetingElement.innerHTML = `Bem vindo,<br> <span class="user-name">${loggedInUser.name}!</span>`
    renderMemories()
    renderAlbums()
    updateAddMemoryButtons()
  }

  const renderMemories = () => { 
    memoriesContainer.innerHTML = ""
    const currentAlbumIdNum = currentAlbumId ? Number.parseInt(currentAlbumId) : null;

    const filteredMemories = currentAlbumIdNum
      // ATUALIZADO: Agora verifica se o array albumIds da memória INCLUI o currentAlbumId
      ? memories.filter((m) => m.albumIds.includes(currentAlbumIdNum))
      : memories 

    if (filteredMemories.length === 0) {
      emptyState.style.display = "block"
      if (currentAlbumId) {
        emptyState.querySelector("p").textContent =
          `Não há memórias para exibir neste álbum. Clique em "Adicionar Memórias ao Álbum" para adicionar memórias existentes.`
        emptyState.querySelector(".empty-icon").textContent = "FOLDER"
      } else {
        emptyState.querySelector("p").textContent =
          'Você ainda não possui memórias. Clique em "Adicionar Memórias" para começar.'
        emptyState.querySelector(".empty-icon").textContent = "MEMÓRIA"
      }
    } else {
      emptyState.style.display = "none"
      filteredMemories.forEach((memory) => {
        const card = document.createElement("div")
        card.className = "memory-card"
        const imageUrl = memory.imageUrl.startsWith("/uploads") ? `${API_URL}${memory.imageUrl}` : memory.imageUrl
        card.innerHTML = `<img src="${imageUrl}" alt="${memory.title}" class="memory-image" data-id="${memory.id}">`
        card.querySelector(".memory-image").addEventListener("click", () => {
          const memoryToView = memories.find((m) => m.id == memory.id)
          showMemoryDetails(memoryToView)
        })
        memoriesContainer.appendChild(card)
      })
    }
  }
  
  const renderAlbums = () => { 
    albumsList.innerHTML = ""
    albums.forEach((album) => {
      const li = document.createElement("li")
      li.className = "album-item-container"
      li.innerHTML = `
                <a href="#" class="menu-item album-item" data-id="${album.id}"><span class="material-icons">folder</span> ${album.title}</a>
                <div class="album-actions">
                    <button class="icon-btn edit-album-btn" data-id="${album.id}"><span class="material-icons">edit</span></button>
                    <button class="icon-btn delete-album-btn" data-id="${album.id}"><span class="material-icons">delete</span></button>
                </div>
            `
      albumsList.appendChild(li)
    })
  }
  
  const showMemoryDetails = (memory) => { 
    const imageUrl = memory.imageUrl.startsWith("/uploads") ? `${API_URL}${memory.imageUrl}` : memory.imageUrl
    
    // CORRIGIDO: Agora verifica se a memória está no álbum atual ANTES de renderizar o botão.
    const removeButtonHtml = (memory.albumIds.includes(Number.parseInt(currentAlbumId)) && currentAlbumId) 
        ? `<button class="icon-btn remove-from-album-btn" data-id="${memory.id}"><span class="material-icons">folder_delete</span></button>` 
        : "";

    viewMemoryContent.innerHTML = `
            <img src="${imageUrl}" alt="${memory.title}" style="max-width: 100%; max-height: 80vh; object-fit: contain; display: block; margin: 0 auto;">
            <div class="memory-details-view">
                <h3>${memory.title || "Sem título"}</h3>
                <p><strong>Sentimento:</strong> ${memory.sentiment || "Não informado"}</p>
                <p><strong>Descrição:</strong> ${memory.description || "Sem descrição"}</p>
                <p><strong>Data:</strong> ${memory.date || "Não informada"}</p>
            </div>
            <div class="memory-actions modal-actions">
                ${removeButtonHtml}
                <button class="icon-btn edit-btn" data-id="${memory.id}"><span class="material-icons">edit</span></button>
                <button class="icon-btn delete-btn" data-id="${memory.id}"><span class="material-icons">delete</span></button>
            </div>
        `

    const editBtn = viewMemoryContent.querySelector(".edit-btn")
    const deleteBtn = viewMemoryContent.querySelector(".delete-btn")
    const removeFromAlbumBtn = viewMemoryContent.querySelector(".remove-from-album-btn")
    const memoryId = memory.id
    const targetAlbumId = currentAlbumId;


    if (editBtn) {
      editBtn.addEventListener("click", () => {
        const memoryToEdit = memories.find((m) => m.id == memoryId)
        if (memoryToEdit) {
          document.getElementById("memory-id").value = memoryToEdit.id
          document.getElementById("memory-title").value = memoryToEdit.title
          document.getElementById("memory-description").value = memoryToEdit.description
          document.getElementById("memory-date").value = memoryToEdit.date
          memorySentimentInput.value = memoryToEdit.sentiment || ""
          imageUploadField.style.display = "none"
          document.getElementById("memory-image").required = false
          memoryModalTitle.textContent = "Editar Memória"
          hideModal("view-memory-modal")
          showModal("memory-modal")
        }
      })
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (await customConfirm("Tem certeza que deseja excluir esta memória?")) {
          try {
            const response = await fetch(`${API_URL}/memories/${memoryId}`, { method: "DELETE" })
            if (response.ok) {
              showCustomAlert("Memória excluída com sucesso!", 'success')
              await fetchData()
              hideModal("view-memory-modal")
            } else {
              showCustomAlert("Erro ao excluir memória.", 'error')
            }
          } catch (error) {
            showCustomAlert("Erro ao conectar ao servidor.", 'error')
          }
        }
      })
    }

    if (removeFromAlbumBtn) {
      removeFromAlbumBtn.addEventListener("click", async () => {
        if (await customConfirm("Tem certeza que deseja remover esta memória do álbum?")) {
          try {
            // CORRIGIDO: Usa a nova rota DELETE M:N
            const response = await fetch(`${API_URL}/memory_albums/${memoryId}/${targetAlbumId}`, {
              method: "DELETE",
            })
            if (response.ok) {
              showCustomAlert("Memória removida do álbum com sucesso!", 'success')
              await fetchData()
              hideModal("view-memory-modal")
            } else {
              showCustomAlert("Erro ao remover memória do álbum.", 'error')
            }
          } catch (error) {
            showCustomAlert("Erro ao conectar ao servidor.", 'error')
            console.error("Remove from album error:", error)
          }
        }
      })
    }

    showModal("view-memory-modal")
  }
  
  const showAddMemoriesToAlbumModal = (albumId) => { 
    const targetAlbumId = Number.parseInt(albumId);
    const albumTitle = albums.find((a) => a.id === targetAlbumId).title

    // CORRIGIDO: Filtra para mostrar APENAS as memórias que NÃO estão no álbum de destino.
    const memoriesAvailable = memories.filter((m) => 
        !m.albumIds.includes(targetAlbumId)
    );

    memoriesToAddList.innerHTML = ""
    document.getElementById("add-to-album-title").textContent = `Adicione suas memórias ao álbum "${albumTitle}":`

    if (memoriesAvailable.length > 0) {
      memoriesAvailable.forEach((memory) => {
        const item = document.createElement("div")
        item.className = "memory-item"
        const imageUrl = memory.imageUrl.startsWith("/uploads") ? `${API_URL}${memory.imageUrl}` : memory.imageUrl
        item.innerHTML = `
                    <input type="checkbox" data-id="${memory.id}">
                    <img src="${imageUrl}" alt="${memory.title}">
                `
        memoriesToAddList.appendChild(item)
      })
      showModal("add-to-album-modal")
    } else {
      showCustomAlert(`Todas as suas memórias já estão no álbum "${albumTitle}".`, 'info')
    }
  }


  // Eventos
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser")
    window.location.href = "index.html"
  })

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show")
  })

  homeLink.addEventListener("click", (e) => {
    e.preventDefault()
    currentAlbumId = null
    contentTitle.textContent = "Minhas Memórias"
    renderMemories()
    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"))
    homeLink.classList.add("active")
    sidebar.classList.remove("show")
    updateAddMemoryButtons()
  })

  createAlbumLink.addEventListener("click", async (e) => {
    e.preventDefault()
    const albumTitle = await customPrompt("Qual será o nome desse album?")

    if (albumTitle) {
      try {
        const response = await fetch(`${API_URL}/albums`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: albumTitle, userId: loggedInUser.id }),
        })
        if (response.ok) {
          showCustomAlert("Álbum criado com sucesso!", 'success')
          await fetchData()
        } else {
          showCustomAlert("Erro ao criar álbum.", 'error')
        }
      } catch (error) {
        showCustomAlert("Erro ao conectar ao servidor.", 'error')
      }
    }
    sidebar.classList.remove("show")
  })

  mapaIlhasLink.addEventListener("click", (e) => {
    e.preventDefault()
    window.location.href = "mapa-ilhas.html"
  })

  albumsList.addEventListener("click", async (e) => {
    const target = e.target.closest(".album-item")
    const editBtn = e.target.closest(".edit-album-btn")
    const deleteBtn = e.target.closest(".delete-album-btn")

    if (target) {
      e.preventDefault()
      currentAlbumId = target.dataset.id
      const albumTitle = albums.find((a) => a.id == currentAlbumId).title
      contentTitle.textContent = albumTitle
      renderMemories()
      document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"))
      target.classList.add("active")
      sidebar.classList.remove("show")
      updateAddMemoryButtons()
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
            showCustomAlert("Nome do álbum alterado com sucesso!", 'success')
            await fetchData()
          } else {
            showCustomAlert("Erro ao alterar nome do álbum.", 'error')
          }
        } catch (error) {
          showCustomAlert("Erro ao conectar ao servidor.", 'error')
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
            showCustomAlert("Álbum excluído com sucesso!", 'success')
            await fetchData()
            currentAlbumId = null
            contentTitle.textContent = "Minhas Memórias"
            updateAddMemoryButtons()
          } else {
            showCustomAlert("Erro ao excluir álbum.", 'error')
          }
        } catch (error) {
          showCustomAlert("Erro ao conectar ao servidor.", 'error')
        }
      }
    }
  })

  // O listener AGORA USA A FUNÇÃO CENTRALIZADA
  addMemoryBtn.addEventListener("click", () => {
    openAddMemoryModal();
  })

  // NOVO: Listener para o novo botão no corpo principal - AÇÃO DE ADICIONAR MEMÓRIA EXISTENTE
  addToAlbumBtn.addEventListener("click", () => {
    if (currentAlbumId) {
      showAddMemoriesToAlbumModal(currentAlbumId) // Abre o modal de seleção de memórias NÃO atribuídas
    } else {
      showCustomAlert("Selecione um álbum para adicionar memórias.", 'warning')
    }
  })

  // CORRIGIDO: Usa a nova rota POST M:N para criar a ligação
  addSelectedMemoriesBtn.addEventListener("click", async () => {
    const checkboxes = memoriesToAddList.querySelectorAll('input[type="checkbox"]:checked')
    const selectedMemoryIds = Array.from(checkboxes).map((checkbox) => Number.parseInt(checkbox.dataset.id))
    
    if (selectedMemoryIds.length === 0) {
      showCustomAlert("Selecione pelo menos uma memória para adicionar ao álbum.", 'warning')
      return
    }

    const targetAlbumId = currentAlbumId;
    let successCount = 0;
    
    try {
      for (const memoryId of selectedMemoryIds) {
        const response = await fetch(`${API_URL}/memory_albums`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memoryId: memoryId, albumId: targetAlbumId }),
        })
        // 409 é a resposta de "já existe" no backend, consideramos sucesso de fluxo
        if (response.ok || response.status === 409) { 
            successCount++;
        }
      }
      
      if (successCount > 0) {
        showCustomAlert(`${successCount} Memória(s) adicionada(s) ao álbum com sucesso!`, 'success')
        await fetchData()
        hideModal("add-to-album-modal")
      } else {
         showCustomAlert(`Nenhuma memória foi adicionada.`, 'warning')
      }
    } catch (error) {
      showCustomAlert("Erro ao conectar ao servidor durante a adição.", 'error')
    }
  })

  memoryForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const id = memoryIdInput.value
    const imageFile = e.target["memory-image"].files[0]
    const title = e.target["memory-title"].value
    const description = e.target["memory-description"].value
    const date = e.target["memory-date"].value
    const sentiment = memorySentimentInput.value

    if (id) {
      // Atualizar memória existente (SÓ METADADOS)
      try {
        const response = await fetch(`${API_URL}/memories/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, date, sentiment }),
        })
        if (response.ok) {
          showCustomAlert("Memória atualizada com sucesso!", 'success')
          await fetchData()
          hideModal("memory-modal")
          hideModal("view-memory-modal")
        } else {
          showCustomAlert("Erro ao atualizar memória.", 'error')
        }
      } catch (error) {
        showCustomAlert("Erro ao conectar ao servidor.", 'error')
      }
    } else {
      // Adicionar nova memória (upload)
      if (!imageFile) {
        showCustomAlert("Por favor, selecione uma memória (imagem).", 'warning')
        return
      }

      const formData = new FormData()
      formData.append("memoryImage", imageFile)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("date", date)
      formData.append("userId", loggedInUser.id)
      formData.append("albumId", currentAlbumId || "") // albumId não é mais usado na rota, mas mantido para compatibilidade
      formData.append("sentiment", sentiment)

      try {
        const response = await fetch(`${API_URL}/memories`, {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (response.ok) {
          showCustomAlert("Memória adicionada com sucesso!", 'success')
          await fetchData()
          hideModal("memory-modal")
        } else {
          showCustomAlert(`Erro ao adicionar memória: ${data.message || response.statusText}`, 'error')
        }
      } catch (error) {
        showCustomAlert("Erro ao conectar ao servidor.", 'error')
        console.error("Add memory error:", error)
      }
    }
  })

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal")
      if (modal) hideModal(modal.id)
    })
  })

  window.addEventListener("click", (e) => {
    if (e.target.id === "memory-modal" || e.target.id === "add-to-album-modal" || e.target.id === "view-memory-modal" || e.target.id === "custom-confirm-modal" || e.target.id === "custom-prompt-modal") {
        hideModal(e.target.id);
    }
  })

  memoriesContainer.addEventListener("click", (e) => {
    const target = e.target.closest("button")
    if (!target) return
    const memoryId = target.dataset.id

    if (target.classList.contains("edit-btn")) {
      const memoryToEdit = memories.find((m) => m.id == memoryId)
      if (memoryToEdit) {
        document.getElementById("memory-id").value = memoryToEdit.id
        document.getElementById("memory-title").value = memoryToEdit.title
        document.getElementById("memory-description").value = memoryToEdit.description
        document.getElementById("memory-date").value = memoryToEdit.date
        memorySentimentInput.value = memoryToEdit.sentiment || ""
        imageUploadField.style.display = "none"
        document.getElementById("memory-image").required = false
        memoryModalTitle.textContent = "Editar Memória"
        showModal("memory-modal")
      }
    } else if (target.classList.contains("delete-btn")) {
        const memoryDocId = target.dataset.id
        customConfirm("Tem certeza que deseja excluir esta memória?").then((result) => {
            if (result) {
                fetch(`${API_URL}/memories/${memoryDocId}`, { method: "DELETE" })
                .then((response) => {
                    if (response.ok) {
                        showCustomAlert("Memória excluída com sucesso!", 'success')
                        fetchData()
                    } else {
                        showCustomAlert("Erro ao excluir memória.", 'error')
                    }
                })
                .catch((error) => {
                    showCustomAlert("Erro ao conectar ao servidor.", 'error')
                    console.error("Delete error:", error)
                })
            }
        });
    } else if (target.classList.contains("remove-from-album-btn")) {
        const memoryDocId = target.dataset.id
        const targetAlbumId = currentAlbumId; // ID do álbum atual, obtido do estado da página
        
        customConfirm("Tem certeza que deseja remover esta memória do álbum?").then((result) => {
            if (result) {
                // CORRIGIDO: Usa a nova rota DELETE M:N
                fetch(`${API_URL}/memory_albums/${memoryDocId}/${targetAlbumId}`, {
                    method: "DELETE",
                })
                .then((response) => {
                    if (response.ok) {
                        showCustomAlert("Memória removida do álbum com sucesso!", 'success')
                        fetchData()
                    } else {
                        showCustomAlert("Erro ao remover memória do álbum.", 'error')
                    }
                })
                .catch((error) => {
                    showCustomAlert("Erro ao conectar ao servidor.", 'error')
                    console.error("Remove from album error:", error)
                })
            }
        });
    }
  })

  fetchData()
})
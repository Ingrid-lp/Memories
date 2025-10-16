document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menu-btn")
  const sidebar = document.getElementById("sidebar")
  const logoutBtn = document.getElementById("logout-btn")
  const greetingElement = document.getElementById("greeting")
  const albumsList = document.getElementById("albums-list")
  const createAlbumLink = document.getElementById("create-album-link")

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"))
  if (!loggedInUser) {
    window.location.href = "index.html"
    return
  }

  let albums = []
  const API_URL = "http://localhost:3000"

  const fetchAlbums = async () => {
    try {
      const response = await fetch(`${API_URL}/albums/${loggedInUser.id}`)
      albums = await response.json()
      renderAlbums()
    } catch (error) {
      console.error("Erro ao carregar álbuns:", error)
    }
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

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser")
    window.location.href = "index.html"
  })

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show")
  })

  createAlbumLink.addEventListener("click", async (e) => {
    e.preventDefault()
    const albumTitle = prompt("Digite o título do novo álbum:")

    if (albumTitle && albumTitle.trim().length > 10) {
      alert("O título do álbum não pode ter mais de 10 caracteres.")
      sidebar.classList.remove("show")
      return
    }

    if (albumTitle) {
      try {
        const response = await fetch(`${API_URL}/albums`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: albumTitle, userId: loggedInUser.id }),
        })
        if (response.ok) {
          alert("Álbum criado com sucesso!")
          await fetchAlbums()
        } else {
          alert("Erro ao criar álbum.")
        }
      } catch (error) {
        alert("Erro ao conectar ao servidor.")
      }
    }
    sidebar.classList.remove("show")
  })

  albumsList.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-album-btn")
    const deleteBtn = e.target.closest(".delete-album-btn")

    if (editBtn) {
      e.preventDefault()
      const albumId = editBtn.dataset.id
      const albumToEdit = albums.find((a) => a.id == albumId)
      const newTitle = prompt("Digite o novo nome para o álbum:", albumToEdit.title)

      if (newTitle && newTitle.trim().length > 10) {
        alert("O título do álbum não pode ter mais de 10 caracteres.")
        return
      }

      if (newTitle && newTitle.trim() !== "") {
        try {
          const response = await fetch(`${API_URL}/albums/${albumId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          })
          if (response.ok) {
            alert("Nome do álbum alterado com sucesso!")
            await fetchAlbums()
          } else {
            alert("Erro ao alterar nome do álbum.")
          }
        } catch (error) {
          alert("Erro ao conectar ao servidor.")
        }
      }
    }

    if (deleteBtn) {
      e.preventDefault()
      const albumId = deleteBtn.dataset.id
      if (confirm("Tem certeza que deseja excluir este álbum e todas as memórias associadas a ele?")) {
        try {
          const response = await fetch(`${API_URL}/albums/${albumId}`, { method: "DELETE" })
          if (response.ok) {
            alert("Álbum excluído com sucesso!")
            await fetchAlbums()
          } else {
            alert("Erro ao excluir álbum.")
          }
        } catch (error) {
          alert("Erro ao conectar ao servidor.")
        }
      }
    }
  })

  greetingElement.innerHTML = `Bem vindo,<br> <span class="user-name">${loggedInUser.name}!</span>`
  fetchAlbums()
})

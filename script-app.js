document.addEventListener('DOMContentLoaded', () => {
            const greetingElement = document.getElementById('greeting');
            const memoriesContainer = document.getElementById('memories-container');
            const addMemoryBtn = document.getElementById('add-memory-btn');
            const memoryModal = document.getElementById('memory-modal');
            const memoryForm = document.getElementById('memory-form');
            const memoryIdInput = document.getElementById('memory-id');
            const memoryModalTitle = document.getElementById('modal-title');
            const logoutBtn = document.getElementById('logout-btn');
            const menuBtn = document.getElementById('menu-btn');
            const sidebar = document.getElementById('sidebar');
            const homeLink = document.getElementById('home-link');
            const createAlbumLink = document.getElementById('create-album-link');
            const albumsList = document.getElementById('albums-list');
            const contentTitle = document.getElementById('content-title');
            const emptyState = document.getElementById('empty-state');
            const addToAlbumModal = document.getElementById('add-to-album-modal');
            const memoriesToAddList = document.getElementById('memories-to-add-list');
            const addSelectedMemoriesBtn = document.getElementById('add-selected-memories-btn');
            const viewMemoryModal = document.getElementById('view-memory-modal');
            const viewMemoryContent = document.getElementById('view-memory-content');
            const imageUploadField = document.getElementById('image-upload-field');

            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            if (!loggedInUser) {
                window.location.href = 'index.html';
                return;
            }

            let memories = [];
            let albums = [];
            let currentAlbumId = null;

            const API_URL = 'http://localhost:3000';

            const fetchData = async() => {
                try {
                    const memoriesResponse = await fetch(`${API_URL}/memories/${loggedInUser.id}`);
                    memories = await memoriesResponse.json();

                    const albumsResponse = await fetch(`${API_URL}/albums/${loggedInUser.id}`);
                    albums = await albumsResponse.json();

                    renderScreen();
                } catch (error) {
                    alert('Erro ao carregar dados do servidor. Certifique-se de que o servidor Node.js está rodando.');
                    console.error('Fetch data error:', error);
                }
            };

            const renderScreen = () => {
                greetingElement.textContent = `Olá, ${loggedInUser.name}`;
                renderMemories();
                renderAlbums();
            };

            const renderMemories = () => {
                memoriesContainer.innerHTML = '';
                const filteredMemories = currentAlbumId ?
                    memories.filter(m => m.albumId === parseInt(currentAlbumId)) :
                    memories.filter(m => m.albumId === null);

                if (filteredMemories.length === 0) {
                    emptyState.style.display = 'block';
                } else {
                    emptyState.style.display = 'none';
                    filteredMemories.forEach(memory => {
                        const card = document.createElement('div');
                        card.className = 'memory-card';
                        card.innerHTML = `
                    <img src="${memory.imageUrl}" alt="${memory.title}" class="memory-image" data-id="${memory.id}">
                `;

                        card.querySelector('.memory-image').addEventListener('click', () => {
                            const memoryToView = memories.find(m => m.id == memory.id);
                            showMemoryDetails(memoryToView);
                        });

                        memoriesContainer.appendChild(card);
                    });
                }
            };

            const renderAlbums = () => {
                albumsList.innerHTML = '';
                albums.forEach(album => {
                    const li = document.createElement('li');
                    li.className = 'album-item-container';
                    li.innerHTML = `
                <a href="#" class="menu-item album-item" data-id="${album.id}"><span class="material-icons">folder</span> ${album.title}</a>
                <div class="album-actions">
                    <button class="icon-btn edit-album-btn" data-id="${album.id}"><span class="material-icons">edit</span></button>
                    <button class="icon-btn delete-album-btn" data-id="${album.id}"><span class="material-icons">delete</span></button>
                </div>
            `;
                    albumsList.appendChild(li);
                });
            };

            const showModal = (modalId) => {
                document.getElementById(modalId).style.display = 'flex';
            };

            const hideModal = (modalId) => {
                document.getElementById(modalId).style.display = 'none';
            };

            const showMemoryDetails = (memory) => {
                    viewMemoryContent.innerHTML = `
            <img src="${memory.imageUrl}" alt="${memory.title}" style="max-width: 100%; max-height: 80vh; object-fit: contain; display: block; margin: 0 auto;">
            <div class="memory-details-view">
                <h3>${memory.title || 'Sem título'}</h3>
                <p><strong>Descrição:</strong> ${memory.description || 'Sem descrição'}</p>
                <p><strong>Data:</strong> ${memory.date || 'Não informada'}</p>
            </div>
            <div class="memory-actions modal-actions">
                ${memory.albumId ? `<button class="icon-btn remove-from-album-btn" data-id="${memory.id}"><span class="material-icons">folder_delete</span></button>` : ''}
                <button class="icon-btn edit-btn" data-id="${memory.id}"><span class="material-icons">edit</span></button>
                <button class="icon-btn delete-btn" data-id="${memory.id}"><span class="material-icons">delete</span></button>
            </div>
        `;
        
        const editBtn = viewMemoryContent.querySelector('.edit-btn');
        const deleteBtn = viewMemoryContent.querySelector('.delete-btn');
        const removeFromAlbumBtn = viewMemoryContent.querySelector('.remove-from-album-btn');
        const memoryId = memory.id;

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const memoryToEdit = memories.find(m => m.id == memoryId);
                if (memoryToEdit) {
                    document.getElementById('memory-id').value = memoryToEdit.id;
                    document.getElementById('memory-title').value = memoryToEdit.title;
                    document.getElementById('memory-description').value = memoryToEdit.description;
                    document.getElementById('memory-date').value = memoryToEdit.date;
                    imageUploadField.style.display = 'none';
                    document.getElementById('memory-image').required = false;
                    memoryModalTitle.textContent = 'Editar Memória';
                    hideModal('view-memory-modal');
                    showModal('memory-modal');
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja excluir esta memória?')) {
                    try {
                        const response = await fetch(`${API_URL}/memories/${memoryId}`, { method: 'DELETE' });
                        if (response.ok) {
                            alert('Memória excluída com sucesso!');
                            await fetchData();
                            hideModal('view-memory-modal');
                        } else {
                            alert('Erro ao excluir memória.');
                        }
                    } catch (error) {
                        alert('Erro ao conectar ao servidor.');
                    }
                }
            });
        }

        if (removeFromAlbumBtn) {
            removeFromAlbumBtn.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja remover esta memória do álbum?')) {
                    try {
                        const response = await fetch(`${API_URL}/memories/${memoryId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ albumId: null })
                        });
                        if (response.ok) {
                            alert('Memória removida do álbum com sucesso!');
                            await fetchData();
                            hideModal('view-memory-modal');
                        } else {
                            alert('Erro ao remover memória do álbum.');
                        }
                    } catch (error) {
                        alert('Erro ao conectar ao servidor.');
                    }
                }
            });
        }

        showModal('view-memory-modal');
    };

    const showAddMemoriesToAlbumModal = (albumId) => {
        const albumTitle = albums.find(a => a.id == albumId).title;
        const memoriesNotInAlbum = memories.filter(m => m.albumId === null);
    
        memoriesToAddList.innerHTML = '';
        document.getElementById('add-to-album-title').textContent = `Adicione suas memórias ao álbum "${albumTitle}":`;
    
        if (memoriesNotInAlbum.length > 0) {
            memoriesNotInAlbum.forEach(memory => {
                const item = document.createElement('div');
                item.className = 'memory-item';
                item.innerHTML = `
                    <input type="checkbox" data-id="${memory.id}">
                    <img src="${memory.imageUrl}" alt="${memory.title}">
                `;
                memoriesToAddList.appendChild(item);
            });
            showModal('add-to-album-modal');
        } else {
            alert(`Todas as suas memórias já estão no álbum "${albumTitle}".`);
        }
    };
    

    // Eventos
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });

    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentAlbumId = null;
        contentTitle.textContent = 'Minhas Memórias';
        renderMemories();
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        homeLink.classList.add('active');
        sidebar.classList.remove('show');
        addMemoryBtn.style.display = 'block';
        addToAlbumBtn.style.display = 'none';
    });

    createAlbumLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const albumTitle = prompt('Digite o título do novo álbum:');
        if (albumTitle) {
            try {
                const response = await fetch(`${API_URL}/albums`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: albumTitle, userId: loggedInUser.id })
                });
                if (response.ok) {
                    alert('Álbum criado com sucesso!');
                    await fetchData();
                } else {
                    alert('Erro ao criar álbum.');
                }
            } catch (error) {
                alert('Erro ao conectar ao servidor.');
            }
        }
        sidebar.classList.remove('show');
    });

    albumsList.addEventListener('click', async (e) => {
        const target = e.target.closest('.album-item');
        const editBtn = e.target.closest('.edit-album-btn');
        const deleteBtn = e.target.closest('.delete-album-btn');

        if (target) {
            e.preventDefault();
            currentAlbumId = target.dataset.id;
            const albumTitle = albums.find(a => a.id == currentAlbumId).title;
            contentTitle.textContent = albumTitle;
            renderMemories();
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            target.classList.add('active');
            sidebar.classList.remove('show');
            addMemoryBtn.style.display = 'none';
            addToAlbumBtn.style.display = 'block';
        }
        if (editBtn) {
            e.preventDefault();
            const albumId = editBtn.dataset.id;
            const albumToEdit = albums.find(a => a.id == albumId);
            const newTitle = prompt('Digite o novo nome para o álbum:', albumToEdit.title);
            if (newTitle && newTitle.trim() !== '') {
                try {
                    const response = await fetch(`${API_URL}/albums/${albumId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: newTitle })
                    });
                    if (response.ok) {
                        alert('Nome do álbum alterado com sucesso!');
                        await fetchData();
                    } else {
                        alert('Erro ao alterar nome do álbum.');
                    }
                } catch (error) {
                    alert('Erro ao conectar ao servidor.');
                }
            }
        }
        if (deleteBtn) {
            e.preventDefault();
            const albumId = deleteBtn.dataset.id;
            if (confirm('Tem certeza que deseja excluir este álbum e todas as memórias associadas a ele?')) {
                try {
                    const response = await fetch(`${API_URL}/albums/${albumId}`, { method: 'DELETE' });
                    if (response.ok) {
                        alert('Álbum excluido com sucesso!');
                        await fetchData();
                        currentAlbumId = null;
                        contentTitle.textContent = 'Minhas Memórias';
                    } else {
                        alert('Erro ao excluir álbum.');
                    }
                } catch (error) {
                    alert('Erro ao conectar ao servidor.');
                }
            }
        }
    });

    addMemoryBtn.addEventListener('click', () => {
        memoryForm.reset();
        imageUploadField.style.display = 'block';
        document.getElementById('memory-image').required = true;
        memoryIdInput.value = '';
        memoryModalTitle.textContent = 'Adicionar Nova Memória';
        showModal('memory-modal');
    });

    addToAlbumBtn.addEventListener('click', () => {
        if (currentAlbumId) {
            showAddMemoriesToAlbumModal(currentAlbumId);
        } else {
            alert('Selecione um álbum para adicionar memórias.');
        }
    });

    addSelectedMemoriesBtn.addEventListener('click', async () => {
        const checkboxes = memoriesToAddList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedMemoryIds = Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
        if (selectedMemoryIds.length === 0) {
            alert('Selecione pelo menos uma memória para adicionar ao álbum.');
            return;
        }

        try {
            for (const id of selectedMemoryIds) {
                const response = await fetch(`${API_URL}/memories/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ albumId: currentAlbumId })
                });
            }
            alert('Memórias adicionadas com sucesso!');
            await fetchData();
            hideModal('add-to-album-modal');
        } catch (error) {
            alert('Erro ao conectar ao servidor.');
        }
    });

    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = memoryIdInput.value;
        const imageFile = e.target['memory-image'].files[0];
        const title = e.target['memory-title'].value;
        const description = e.target['memory-description'].value;
        const date = e.target['memory-date'].value;

        if (id) {
            // Atualizar memória existente
            try {
                const response = await fetch(`${API_URL}/memories/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description, date })
                });
                if (response.ok) {
                    alert('Memória atualizada com sucesso!');
                    await fetchData();
                    hideModal('memory-modal');
                } else {
                    alert('Erro ao atualizar memória.');
                }
            } catch (error) {
                alert('Erro ao conectar ao servidor.');
            }
        } else {
            // Adicionar nova memória
            if (!imageFile) {
                alert('Por favor, selecione uma memória.');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const imageUrl = event.target.result;
                try {
                    const response = await fetch(`${API_URL}/memories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: loggedInUser.id,
                            imageUrl,
                            title,
                            description,
                            date,
                            albumId: null
                        })
                    });
                    if (response.ok) {
                        alert('Memória adicionada com sucesso!');
                        await fetchData();
                        hideModal('memory-modal');
                    } else {
                        alert('Erro ao adicionar memória.');
                    }
                } catch (error) {
                    alert('Erro ao conectar ao servidor.');
                }
            };
            reader.readAsDataURL(imageFile);
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.id === 'memory-modal') {
            hideModal('memory-modal');
        }
        if (e.target.id === 'add-to-album-modal') {
            hideModal('add-to-album-modal');
        }
        if (e.target.id === 'view-memory-modal') {
            hideModal('view-memory-modal');
        }
    });

    memoriesContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const memoryId = target.dataset.id;
        if (target.classList.contains('edit-btn')) {
            const memoryToEdit = memories.find(m => m.id == memoryId);
            if (memoryToEdit) {
                document.getElementById('memory-id').value = memoryToEdit.id;
                document.getElementById('memory-title').value = memoryToEdit.title;
                document.getElementById('memory-description').value = memoryToEdit.description;
                document.getElementById('memory-date').value = memoryToEdit.date;
                imageUploadField.style.display = 'none';
                document.getElementById('memory-image').required = false;
                memoryModalTitle.textContent = 'Editar Memória';
                showModal('memory-modal');
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Tem certeza que deseja excluir esta memória?')) {
                const memoryDocId = target.dataset.id;
                fetch(`${API_URL}/memories/${memoryDocId}`, { method: 'DELETE' })
                    .then(response => {
                        if (response.ok) {
                            alert('Memória excluída com sucesso!');
                            fetchData();
                        } else {
                            alert('Erro ao excluir memória.');
                        }
                    })
                    .catch(error => {
                        alert('Erro ao conectar ao servidor.');
                        console.error('Delete error:', error);
                    });
            }
        } else if (target.classList.contains('remove-from-album-btn')) {
            if (confirm('Tem certeza que deseja remover esta memória do álbum?')) {
                const memoryDocId = target.dataset.id;
                fetch(`${API_URL}/memories/${memoryDocId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ albumId: null })
                })
                    .then(response => {
                        if (response.ok) {
                            alert('Memória removida do álbum com sucesso!');
                            fetchData();
                        } else {
                            alert('Erro ao remover memória do álbum.');
                        }
                    })
                    .catch(error => {
                        alert('Erro ao conectar ao servidor.');
                        console.error('Remove from album error:', error);
                    });
            }
        }
    });

    fetchData();
});
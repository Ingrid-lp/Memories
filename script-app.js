document.addEventListener('DOMContentLoaded', () => {
    // Referências a elementos do DOM
    const mainApp = document.getElementById('main-app');
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
    const mainContent = document.getElementById('main-content');
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

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
    }

    let memories = JSON.parse(localStorage.getItem('memories')) || [];
    let albums = JSON.parse(localStorage.getItem('albums')) || [];
    let currentAlbumId = null;

    // Funções de armazenamento e renderização
    const saveToLocalStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const renderScreen = () => {
        greetingElement.textContent = `Olá, ${loggedInUser}`;
        renderMemories();
        renderAlbums();
    };

    const renderMemories = () => {
        memoriesContainer.innerHTML = '';
        const userMemories = memories.filter(m => m.userId === loggedInUser);
        const filteredMemories = currentAlbumId ?
            userMemories.filter(m => m.albumId === currentAlbumId) :
            userMemories;

        if (filteredMemories.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            filteredMemories.forEach(memory => {
                const card = document.createElement('div');
                card.className = 'memory-card';
                card.innerHTML = `
                    <img src="${memory.image}" alt="${memory.title}" class="memory-image" data-id="${memory.id}">
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
        albums.filter(a => a.userId === loggedInUser).forEach(album => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="menu-item album-item" data-id="${album.id}"><span class="material-icons">folder</span> ${album.title}</a>`;
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
            <img src="${memory.image}" alt="${memory.title}" style="max-width: 100%; max-height: 80vh; object-fit: contain; display: block; margin: 0 auto;">
            <div class="memory-details-view">
                <h3>${memory.title || 'Sem título'}</h3>
                <p><strong>Descrição:</strong> ${memory.description || 'Sem descrição'}</p>
                <p><strong>Data:</strong> ${memory.date || 'Não informada'}</p>
            </div>
            <div class="memory-actions modal-actions">
                <button class="icon-btn edit-btn" data-id="${memory.id}"><span class="material-icons">edit</span></button>
                <button class="icon-btn delete-btn" data-id="${memory.id}"><span class="material-icons">delete</span></button>
            </div>
        `;

        const editBtn = viewMemoryContent.querySelector('.edit-btn');
        const deleteBtn = viewMemoryContent.querySelector('.delete-btn');
        const memoryId = memory.id;

        editBtn.addEventListener('click', () => {
            const memoryToEdit = memories.find(m => m.id === memoryId);
            if (memoryToEdit) {
                document.getElementById('memory-id').value = memoryToEdit.id;
                document.getElementById('memory-title').value = memoryToEdit.title;
                document.getElementById('memory-description').value = memoryToEdit.description;
                document.getElementById('memory-date').value = memoryToEdit.date;
                document.getElementById('image-upload-field').style.display = 'none';
                document.getElementById('memory-image').required = false;
                memoryModalTitle.textContent = 'Editar Memória';
                hideModal('view-memory-modal');
                showModal('memory-modal');
            }
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir esta memória?')) {
                memories = memories.filter(m => m.id !== memoryId);
                saveToLocalStorage('memories', memories);
                hideModal('view-memory-modal');
                renderMemories();
            }
        });

        showModal('view-memory-modal');
    };

    const showAddMemoriesToAlbumModal = (albumId) => {
        const albumTitle = albums.find(a => a.id === albumId).title;
        const userMemories = memories.filter(m => m.userId === loggedInUser);
        const memoriesNotInAlbum = userMemories.filter(m => m.albumId !== albumId);

        memoriesToAddList.innerHTML = '';
        document.getElementById('add-to-album-title').textContent = `Adicione suas memórias ao álbum "${albumTitle}":`;

        if (memoriesNotInAlbum.length > 0) {
            memoriesNotInAlbum.forEach(memory => {
                const item = document.createElement('div');
                item.className = 'memory-item';
                item.innerHTML = `
                    <input type="checkbox" data-id="${memory.id}">
                    <img src="${memory.image}" alt="${memory.title}">
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
    });

    createAlbumLink.addEventListener('click', (e) => {
        e.preventDefault();
        const albumTitle = prompt('Digite o título do novo álbum:');
        if (albumTitle) {
            const newAlbum = {
                id: Date.now(),
                userId: loggedInUser,
                title: albumTitle
            };
            albums.push(newAlbum);
            saveToLocalStorage('albums', albums);
            renderAlbums();
            alert(`Álbum "${albumTitle}" criado com sucesso!`);
        }
        sidebar.classList.remove('show');
    });

    albumsList.addEventListener('click', (e) => {
        const target = e.target.closest('.album-item');
        if (!target) return;

        currentAlbumId = parseInt(target.dataset.id);
        const albumTitle = target.textContent.trim();
        contentTitle.textContent = albumTitle;
        renderMemories();

        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        target.classList.add('active');
        sidebar.classList.remove('show');
    });

    addMemoryBtn.addEventListener('click', () => {
        if (currentAlbumId) {
            showAddMemoriesToAlbumModal(currentAlbumId);
        } else {
            memoryForm.reset();
            document.getElementById('image-upload-field').style.display = 'block'; // Exibe o campo na criação
            document.getElementById('memory-image').required = true; // Garante que a imagem é obrigatória ao criar
            memoryIdInput.value = '';
            memoryModalTitle.textContent = 'Adicionar Nova Memória';
            showModal('memory-modal');
        }
    });

    addSelectedMemoriesBtn.addEventListener('click', () => {
        const checkboxes = memoriesToAddList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedMemoryIds = Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.id));
        if (selectedMemoryIds.length === 0) {
            alert('Selecione pelo menos uma memória para adicionar ao álbum.');
            return;
        }
        selectedMemoryIds.forEach(id => {
            const memoryToUpdate = memories.find(m => m.id === id);
            if (memoryToUpdate) {
                memoryToUpdate.albumId = currentAlbumId;
            }
        });
        saveToLocalStorage('memories', memories);
        hideModal('add-to-album-modal');
        renderMemories();
        alert('Memórias adicionadas com sucesso!');
    });

    memoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = memoryIdInput.value;
        const imageFile = e.target['memory-image'].files[0];
        const title = e.target['memory-title'].value;
        const description = e.target['memory-description'].value;
        const date = e.target['memory-date'].value;
        if (id) {
            const memoryToUpdate = memories.find(m => m.id == id);
            if (memoryToUpdate) {
                memoryToUpdate.title = title;
                memoryToUpdate.description = description;
                memoryToUpdate.date = date;
                // A imagem não é editada, então não há lógica aqui
                saveToLocalStorage('memories', memories);
                renderMemories();
                hideModal('memory-modal');
            }
        } else {
            if (!imageFile) {
                alert('Por favor, selecione uma imagem.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const newMemory = {
                    id: Date.now(),
                    userId: loggedInUser,
                    image: event.target.result,
                    title,
                    description,
                    date,
                    albumId: null
                };
                memories.push(newMemory);
                saveToLocalStorage('memories', memories);
                renderMemories();
                hideModal('memory-modal');
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
        const memoryId = parseInt(target.dataset.id);
        if (target.classList.contains('edit-btn')) {
            const memoryToEdit = memories.find(m => m.id === memoryId);
            if (memoryToEdit) {
                document.getElementById('memory-id').value = memoryToEdit.id;
                document.getElementById('memory-title').value = memoryToEdit.title;
                document.getElementById('memory-description').value = memoryToEdit.description;
                document.getElementById('memory-date').value = memoryToEdit.date;
                document.getElementById('image-upload-field').style.display = 'none'; // Esconde o campo de imagem
                document.getElementById('memory-image').required = false; // Torna o campo opcional
                memoryModalTitle.textContent = 'Editar Memória';
                hideModal('view-memory-modal');
                showModal('memory-modal');
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Tem certeza que deseja excluir esta memória?')) {
                memories = memories.filter(m => m.id !== memoryId);
                saveToLocalStorage('memories', memories);
                hideModal('view-memory-modal');
                renderMemories();
            }
        }
    });

    renderScreen();
});
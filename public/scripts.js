const baseUrl = "http://localhost:5500";
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const completedTaskList = document.getElementById('completedTaskList');

function getToken() {
    return localStorage.getItem('token');
}

let token = getToken();

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const keepLoggedIn = document.getElementById('keepLoggedIn').checked;

    axios.post(`${baseUrl}/login`, { username, password })
        .then(response => {
            token = response.data.token;
            localStorage.setItem('token', token); 

            if (!keepLoggedIn) {
                localStorage.removeItem('token');
            }
            
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('todoApp').style.display = 'block';
            fetchTasks();
            fetchCompletedTasks();
        })
        .catch(error => {
            console.error("Login error:", error.response ? error.response.data : error.message);
            alert("Login error. Please try again.");
            document.getElementById('loginForm').style.display = 'block';
        });
}

function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    axios.post(`${baseUrl}/register`, { username, password })
        .then(() => {
            alert("Registration successful. Please log in.");
        })
        .catch(error => {
            console.error("Registration error:", error);
            alert("Registration error. Please try again.");
        });
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    document.getElementById('todoApp').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('loginForm').style.flexDirection = 'column;';
    document.getElementById('loginForm').style.alignItems = 'center;';
    taskList.innerHTML = '';
    completedTaskList.innerHTML = '';
}

function checkSession() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('todoApp').style.display = 'block';
        fetchTasks();
        fetchCompletedTasks();
    }
}

window.addEventListener('load', () => {
    fetchTasks();
    fetchCompletedTasks();
    initSortable();
    checkSession();
});

function fetchTasks() {
    axios.get(`${baseUrl}/tasks`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        taskList.innerHTML = '';
        response.data.sort((a, b) => a.order - b.order).forEach(task => appendTaskToList(task));
    })
    .catch(error => {
        console.error("Error fetching in-progress tasks:", error);
    });
}

function fetchCompletedTasks() {
    axios.get(`${baseUrl}/completedTasks`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        completedTaskList.innerHTML = '';
        response.data.forEach(completedTask => appendCompletedTaskToList(completedTask));
    })
    .catch(error => {
        console.error("Error fetching completed tasks:", error);
    });
}

function initSortable() {
    new Sortable(taskList, {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: function (evt) {
            const taskId = evt.item.dataset.taskId;
            const newIndex = evt.newIndex;
            console.log(`Moved task ID: ${taskId} to new index: ${newIndex}`);
            updateTaskOrder(taskId, newIndex);
        },
    });
}

function updateTaskOrder(taskId, newIndex) {
    axios.put(`${baseUrl}/tasks/${taskId}/reorder`, { newIndex }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        fetchTasks(); 
    })
    .catch(error => {
        console.error("Error updating task order:", error);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': 'and',
        '<': 'lower',
        '>': 'superior',
        "'": 'apostrophe',
        '"': 'quote'
    }[tag] || tag));
}

taskInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "" || taskText.length > 200) return;

    axios.post(`${baseUrl}/tasks`, { taskText }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        fetchTasks(); 
        taskInput.value = "";
    })
    .catch(error => {
        console.error("Error adding task:", error);
    });
}

function appendTaskToList(task) {
    const li = document.createElement('li');
    li.textContent = escapeHTML(task.text);
    li.dataset.taskId = escapeHTML(task._id);

    const buttonContainer = createButtonContainer(task._id);
    li.appendChild(buttonContainer);

    taskList.appendChild(li);
}

function createButtonContainer(taskId) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const buttons = [
        { name: 'checkmark-circle-outline', class: 'valid', action: validTask, title: 'Mark as done' },
        { name: 'duplicate-outline', class: 'duplicate', action: duplicateTask, title: 'Duplicate task' },
        { name: 'pencil-outline', class: 'modify', action: editTask, title: 'Edit task' },
        { name: 'trash-outline', class: 'delete', action: deleteTask, title: 'Delete task' }
    ];

    buttons.forEach(button => {
        const btn = document.createElement('button');
        const icon = document.createElement('ion-icon');
        icon.setAttribute('name', button.name);
        icon.classList.add(button.class);
        icon.setAttribute('title', button.title);
        btn.appendChild(icon);
        btn.addEventListener('click', function() {
            button.action(this.closest('li'), taskId);
        });
        buttonContainer.appendChild(btn);
    });

    return buttonContainer;
}

function validTask(li, taskId) {
    const token = getToken();
    axios.put(`${baseUrl}/tasks/${taskId}/complete`, {}, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        const taskText = li.textContent.trim();
        appendCompletedTaskToList({ text: taskText, _id: taskId });
        li.remove(); 
        fetchCompletedTasks(); 
    })
    .catch(error => {
        console.error("Error marking task as done:", error);
    });
}

function appendCompletedTaskToList(task) {
    const li = document.createElement('li');
    li.textContent = escapeHTML(task.text);
    li.dataset.taskId = escapeHTML(task._id);

    const deleteButton = document.createElement('button');
    const deleteIcon = document.createElement('ion-icon');
    deleteIcon.setAttribute('name', 'trash-outline');
    deleteIcon.classList.add('delete');
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', () => deleteCompletedTask(li, task._id));

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(deleteButton);

    li.appendChild(buttonContainer);
    completedTaskList.appendChild(li);
}

function duplicateTask(li) {
    const taskText = li.firstChild.textContent.trim();
    axios.post(`${baseUrl}/tasks`, { taskText }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        fetchTasks(); 
    })
    .catch(error => {
        console.error("Error duplicating task:", error);
    });
}

function editTask(li, taskId) {
    const taskTextElement = li.firstChild;
    const currentText = taskTextElement.textContent;
    const newTaskText = prompt("Edit task: ", currentText);

    if (newTaskText === null || newTaskText.trim() === "" || newTaskText.length > 200) return;

    axios.put(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, { text: newTaskText }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(() => {
        fetchTasks(); 
    })
    .catch(error => {
        console.error("Error editing task:", error);
    });
}

function deleteTask(li, taskId) {
    axios.delete(`${baseUrl}/tasks/${taskId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        li.remove();
    })
    .catch(error => {
        console.error("Error deleting task:", error);
    });
}

function deleteCompletedTask(li, completedTaskId) {
    axios.delete(`${baseUrl}/completedTasks/${completedTaskId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        li.remove();
    })
    .catch(error => {
        console.error("Error deleting completed task:", error);
    });
}

function showTab(tab, event) {
    const tabs = document.getElementsByClassName("tab-content");
    Array.from(tabs).forEach(t => t.style.display = "none");

    const listId = tab === 'inProgress' ? 'taskList' : 'completedTaskList';
    document.getElementById(listId).style.display = "block";

    const buttons = document.getElementsByClassName("active-tab");
    Array.from(buttons).forEach(b => b.classList.remove("active-tab"));
    event.currentTarget.classList.add("active-tab");
}
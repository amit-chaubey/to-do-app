// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescriptionInput = document.getElementById('task-description');
const tasksList = document.getElementById('tasks-list');
const tasksCount = document.getElementById('tasks-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close-modal');
const editForm = document.getElementById('edit-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDescription = document.getElementById('edit-task-description');

// App State
let tasks = [];
let currentFilter = 'all';

// Initialize the app
function init() {
    loadTasksFromLocalStorage();
    renderTasks();
    updateTasksCount();
    
    // Event listeners
    taskForm.addEventListener('submit', addTask);
    tasksList.addEventListener('click', handleTaskAction);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    filterBtns.forEach(btn => btn.addEventListener('click', applyFilter));
    closeModal.addEventListener('click', closeEditModal);
    editForm.addEventListener('submit', saveEditedTask);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('active')) {
            closeEditModal();
        }
    });
}

// Load tasks from localStorage
function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Save tasks to localStorage
function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Generate a unique ID for tasks
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add a new task
function addTask(e) {
    e.preventDefault();
    
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    
    if (!title) return;
    
    const newTask = {
        id: generateId(),
        title,
        description,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask); // Add to beginning of array
    saveTasksToLocalStorage();
    
    // Clear form
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskTitleInput.focus();
    
    renderTasks();
    updateTasksCount();
    
    // Show animation for new task
    setTimeout(() => {
        const firstTask = tasksList.querySelector('.task-item');
        if (firstTask) {
            firstTask.style.animation = 'none';
            setTimeout(() => {
                firstTask.style.animation = 'fadeIn 0.3s ease';
            }, 10);
        }
    }, 10);
}

// Render tasks based on current filter
function renderTasks() {
    // Filter tasks based on current filter
    const filteredTasks = filterTasks(tasks, currentFilter);
    
    // Clear tasks list
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        renderEmptyState();
        return;
    }
    
    // Render each task
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

// Create a task element
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;
    
    taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
            <button class="task-btn edit-btn" title="Edit task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-btn delete-btn" title="Delete task">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    return taskItem;
}

// Render empty state
function renderEmptyState() {
    let message = '';
    
    switch (currentFilter) {
        case 'all':
            message = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks yet</p>
                    <span>Add a task to get started</span>
                </div>
            `;
            break;
        case 'active':
            message = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No active tasks</p>
                    <span>All tasks are completed</span>
                </div>
            `;
            break;
        case 'completed':
            message = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No completed tasks</p>
                    <span>Complete a task to see it here</span>
                </div>
            `;
            break;
    }
    
    tasksList.innerHTML = message;
}

// Handle task actions (complete, edit, delete)
function handleTaskAction(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Handle checkbox click
    if (e.target.classList.contains('task-checkbox')) {
        toggleTaskCompletion(taskId);
    }
    
    // Handle edit button click
    if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        openEditModal(task);
    }
    
    // Handle delete button click
    if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        deleteTask(taskId);
    }
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasksToLocalStorage();
        renderTasks();
        updateTasksCount();
    }
}

// Delete a task
function deleteTask(taskId) {
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    
    // Add fade-out animation
    if (taskElement) {
        taskElement.style.opacity = '0';
        taskElement.style.transform = 'translateX(20px)';
        taskElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }
    
    // Remove task after animation
    setTimeout(() => {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasksToLocalStorage();
        renderTasks();
        updateTasksCount();
    }, 300);
}

// Open edit modal
function openEditModal(task) {
    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskDescription.value = task.description || '';
    
    editModal.classList.add('active');
    editTaskTitle.focus();
}

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('active');
}

// Save edited task
function saveEditedTask(e) {
    e.preventDefault();
    
    const taskId = editTaskId.value;
    const title = editTaskTitle.value.trim();
    const description = editTaskDescription.value.trim();
    
    if (!title) return;
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].title = title;
        tasks[taskIndex].description = description;
        saveTasksToLocalStorage();
        renderTasks();
        closeEditModal();
    }
}

// Clear completed tasks
function clearCompletedTasks() {
    // Add fade-out animation to completed tasks
    const completedElements = document.querySelectorAll('.task-item.completed');
    completedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
    
    // Remove tasks after animation
    setTimeout(() => {
        tasks = tasks.filter(task => !task.completed);
        saveTasksToLocalStorage();
        renderTasks();
        updateTasksCount();
    }, 300);
}

// Apply filter
function applyFilter(e) {
    const filterType = e.target.dataset.filter;
    
    // Update active filter button
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    currentFilter = filterType;
    renderTasks();
}

// Filter tasks based on filter type
function filterTasks(tasks, filterType) {
    switch (filterType) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// Update tasks count
function updateTasksCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    tasksCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

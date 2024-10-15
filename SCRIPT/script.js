let tasks = [];
let taskHistory = [];
let undoneActions = [];
let urgentTaskQueue = [];
let editIndex = null; 

// Función para registrar una acción en el historial
function recordAction(actionType, task) {
    const action = {
        action: actionType,
        task: { 
            title: task.title, 
            description: task.description, 
            priority: task.priority, 
            dueDate: task.dueDate,
            isUrgent: task.isUrgent,
            category: task.category, 
            subcategory: task.subcategory 
        },
        timestamp: new Date()
    };
    taskHistory.push(action); 
    undoneActions = []; 
    updateHistoryDisplay(); 
    updateUndoRedoButtons(); 
}

// Función para agregar o actualizar una tarea
function addTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const isUrgent = document.getElementById('isUrgent').checked;
    const category = document.getElementById('taskCategory').value;
    const subcategory = document.getElementById('taskSubcategory').value;

    if (title && description && priority && dueDate && category && subcategory) {
        const task = { title, description, priority, dueDate, isUrgent, category, subcategory, completed: false };

        if (editIndex !== null) {
            // Actualizar tarea existente
            tasks[editIndex] = task;
            recordAction("editar", task);
            editIndex = null; 
        } else {
            // Agregar nueva tarea
            tasks.push(task);
            recordAction("agregar", task);
        }

        if (isUrgent) {
            urgentTaskQueue.push(task);
            displayUrgentTasks();
        }

        displayTasks();
        clearForm(); 
    } else {
        alert("Por favor completa todos los campos.");
    }
}

// Función para cargar la tarea en los campos para editar
function editTask(index) {
    const task = tasks[index];
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('isUrgent').checked = task.isUrgent;
    document.getElementById('taskCategory').value = task.category;

    updateSubcategories(); // Actualiza subcategorías
    document.getElementById('taskSubcategory').value = task.subcategory;

    editIndex = index; // Establecemos el índice de la tarea que se está editando
}

// Función para cargar subcategorías según la categoría seleccionada
function updateSubcategories() {
    const category = document.getElementById('taskCategory').value;
    const subcategorySelect = document.getElementById('taskSubcategory');

    subcategorySelect.innerHTML = ''; // Limpia las subcategorías anteriores

    let subcategories = [];

    if (category === 'Trabajo') {
        subcategories = ['Proyecto', 'Reunión', 'Entrega'];
    } else if (category === 'Estudio') {
        subcategories = ['Examen', 'Tarea', 'Lectura'];
    } else if (category === 'Personal') {
        subcategories = ['Compras', 'Ejercicio', 'Hobbies'];
    }

    // Agrega las subcategorías al <select>
    subcategories.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        subcategorySelect.appendChild(option);
    });
}

// Función para marcar una tarea como completada
function completeTask(index) {
    const task = tasks[index];
    task.completed = true;

    // Si la tarea está en la cola de urgentes, la eliminamos de esa cola
    if (task.isUrgent) {
        urgentTaskQueue = urgentTaskQueue.filter(t => t.title !== task.title);
        displayUrgentTasks();
    }

    recordAction("completar", task); 
    displayTasks(); 
}

// Función para eliminar una tarea
function deleteTask(index) {
    const deletedTask = tasks.splice(index, 1)[0]; 
    recordAction("eliminar", deletedTask); 

    // Si la tarea eliminada estaba en la lista de urgentes, también se elimina de allí
    urgentTaskQueue = urgentTaskQueue.filter(task => task.title !== deletedTask.title);
    displayUrgentTasks();

    displayTasks(); 
}

// Función para deshacer la última acción
function undoAction() {
    if (taskHistory.length > 0) {
        const lastAction = taskHistory.pop(); 
        undoneActions.push(lastAction); 

        switch (lastAction.action) {
            case 'agregar':
                tasks = tasks.filter(task => task.title !== lastAction.task.title); 
                urgentTaskQueue = urgentTaskQueue.filter(task => task.title !== lastAction.task.title); 
                break;
            case 'eliminar':
                tasks.push(lastAction.task); 
                if (lastAction.task.isUrgent) urgentTaskQueue.push(lastAction.task); 
                break;
            case 'editar':
                const taskToEdit = tasks.find(task => task.title === lastAction.task.title);
                if (taskToEdit) {
                    Object.assign(taskToEdit, lastAction.task); 
                }
                break;
            case 'completar':
                const taskToComplete = tasks.find(task => task.title === lastAction.task.title);
                if (taskToComplete) {
                    taskToComplete.completed = false; 
                }
                break;
        }

        displayTasks(); 
        displayUrgentTasks(); 
        updateHistoryDisplay(); 
        updateUndoRedoButtons(); 
    }
}

// Función para rehacer la última acción deshecha
function redoAction() {
    if (undoneActions.length > 0) {
        const lastUndoneAction = undoneActions.pop(); 
        taskHistory.push(lastUndoneAction);

        switch (lastUndoneAction.action) {
            case 'agregar':
                tasks.push(lastUndoneAction.task); 
                if (lastUndoneAction.task.isUrgent) urgentTaskQueue.push(lastUndoneAction.task); 
                break;
            case 'eliminar':
                tasks = tasks.filter(task => task.title !== lastUndoneAction.task.title); 
                urgentTaskQueue = urgentTaskQueue.filter(task => task.title !== lastUndoneAction.task.title); 
                break;
            case 'editar':
                const taskToEdit = tasks.find(task => task.title === lastUndoneAction.task.title);
                if (taskToEdit) {
                    Object.assign(taskToEdit, lastUndoneAction.task); 
                }
                break;
            case 'completar':
                const taskToComplete = tasks.find(task => task.title === lastUndoneAction.task.title);
                if (taskToComplete) {
                    taskToComplete.completed = true; 
                }
                break;
        }

        displayTasks(); 
        displayUrgentTasks(); 
        updateHistoryDisplay(); 
        updateUndoRedoButtons(); 
    }
}

// Función para mostrar las tareas urgentes
function displayUrgentTasks() {
    const urgentList = document.getElementById('urgentTaskQueue');
    urgentList.innerHTML = ''; 

    urgentTaskQueue.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('urgent');
        taskItem.innerHTML = `${task.title} (Prioridad: ${task.priority}, Descripción: ${task.description}, Categoría: ${task.category}/${task.subcategory}, Vence: ${task.dueDate})`;
        urgentList.appendChild(taskItem);
    });
}

// Función para mostrar las tareas
function displayTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Limpia la lista de tareas

    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.innerHTML = `
            ${task.title} (Prioridad: ${task.priority}, Descripción: ${task.description}, Categoría: ${task.category}/${task.subcategory}, Vence: ${task.dueDate}) ${task.completed ? "✔️" : ""}
            <button class="delete-btn" onclick="deleteTask(${index})">Eliminar</button>
            <button onclick="editTask(${index})">Editar</button>
            <button onclick="completeTask(${index})">Completar</button>
            
        `       
        if (task.completed) {
            taskItem.classList.add('completed-task');
        } else {
            taskItem.classList.add('incomplete-task');
        }
        ;

        taskList.appendChild(taskItem);
    });
}



// Función para limpiar el formulario de tareas
function clearForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPriority').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('isUrgent').checked = false;
    document.getElementById('taskCategory').value = '';
    document.getElementById('taskSubcategory').innerHTML = ''; 

    editIndex = null; 
}

// Función para actualizar la visualización del historial de acciones
function updateHistoryDisplay() {
    const historyList = document.getElementById('taskHistory');
    historyList.innerHTML = ''; 

    taskHistory.forEach((action, index) => {
        const actionItem = document.createElement('li');
        const actionTranslation = {
            "agregar": "Agregado",
            "eliminar": "Eliminado",
            "editar": "Editado",
            "completar": "Completado"
        };
        actionItem.innerHTML = `
            ${actionTranslation[action.action]}: ${action.task.title} - Categoría: ${action.task.category} - Subcategoría: ${action.task.subcategory} - Fecha: ${action.timestamp.toLocaleString()}
        `;
        historyList.appendChild(actionItem);
    });
}

// Función para actualizar el estado de los botones de deshacer/rehacer
function updateUndoRedoButtons() {
    document.getElementById('undoButton').disabled = taskHistory.length === 0;
    document.getElementById('redoButton').disabled = undoneActions.length === 0;
}

displayTasks();
updateHistoryDisplay();
updateUndoRedoButtons();

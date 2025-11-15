let usersCurrent = [];

window.onload = fetchUsers;

/**
 * Функция для получения пользователей
 * Выполняет запрос на адрес http://127.0.0.1:5000/users
 * Если пользователей не существует, добавляет текст "Пользователи отсутствуют" к заголовку таблицы
 * Если пользователи существуют, создает таблицу и добавляет ее на страницу
 * Добавляет слушатель события 'submit' на форме добавления пользователей
 * 
 * @throws {Error} Ошибка, если запрос не выполнен
 */
async function fetchUsers() {
  try {
    const response = await fetch('http://127.0.0.1:5000/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();

    const title = document.getElementById('users-title');
    title.querySelector('small')?.remove();

    if (data.total === 0) {
      const title = document.getElementById('users-title');
      const small = document.createElement('small');
      small.classList.add('text-body-secondary');
      small.textContent = 'Пользователи отсутствуют';
      title.appendChild(small);
    }
    else {
      createTable(document.getElementById('tbody'), data);
      modalInfoUser();
    }

    addListener('add-user-form', 'submit', addUser);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

/**
 * Функция для добавления пользователя
 * Выполняет запрос на адрес http://127.0.0.1:5000/add_user
 * Если запрос выполнен успешно, то выводит сообщение о добавлении пользователя
 * Если запрос не выполнен, то выводит сообщение об ошибке
 * 
 * @throws {Error} Ошибка, если запрос не выполнен
 */
async function addUser(event) {
  event.preventDefault();

  const messageElement = document.getElementById('message'); // Элемент для вывода сообщений

  clearMessage(messageElement);
  
  try {
    const response = await fetch('http://127.0.0.1:5000/add_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: document.getElementById('exampleInputText').value,
        email: document.getElementById('exampleInputEmail1').value
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      setMessage(messageElement, 'text-danger', data.error);
      return;
    }

    // Успешное добавление пользователя
    setMessage(messageElement, 'text-success', data.message);

    document.getElementById('exampleInputText').value = '';
    document.getElementById('exampleInputEmail1').value = '';

    await fetchUsers();
  } catch (error) {
    console.error('Ошибка:', error);
    messageElement.textContent = 'Произошла ошибка при добавлении пользователя.';
  }
}

/**
 * Очищает элемент и выводит сообщение с указанным классом и текстом
 * 
 * @param {HTMLElement} element - Элемент, в котором выводится сообщение
 * @param {string} className - Класс для элемента (например, 'text-danger' или 'text-success')
 * @param {string} message - Текст сообщения
 */
function setMessage(element, className, message) {
  clearMessage(element);
  element.classList.add(className);
  element.textContent = message;

  // Очищаем сообщение через 5 секунд
  setTimeout(() => clearMessage(element), 5000);
}

/**
 * Очищает текст элемента и удаляет классы 'text-danger' и 'text-success'
 * 
 * @param {HTMLElement} element - элемент, в котором будет очищен текст
 */
function clearMessage(element) {
  element.textContent = '';
  element.classList.remove('text-danger');
  element.classList.remove('text-success');
}

/**
 * Создает таблицу на основе данных о пользователях.
 * 
 * @param {HTMLElement} parentElement - родительский элемент,
 * в котором будет создаваться таблица.
 * 
 * @param {Object} data - объект с данными о пользователях,
 * содержащий массив пользователей.
 * 
 * @returns {Array} отсортированный массив пользователей.
 */
createTable = (parentElement, data) => {
  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }
  
  const sortedUsers = data.users.sort((a, b) => {
    return a.username.localeCompare(b.username);
  });
  
  sortedUsers.forEach((user, index) => {
    const th_element = document.createElement('th');
    th_element.setAttribute('scope', 'row');
    th_element.textContent = index + 1;

    const td_element = document.createElement('td');
    td_element.textContent = user.username;

    const tr_element = document.createElement('tr');
    tr_element.appendChild(th_element);
    tr_element.appendChild(td_element);

    parentElement.appendChild(tr_element);
  })

  const table = document.getElementById('users-table');
  table.style.display = 'table';

  usersCurrent = sortedUsers;
}

/**
 * Функция для отображения информации о пользователе в модальном окне.
 * Срабатывает при клике на строку таблицы.
 * 
 * @returns {undefined}
 */
const modalInfoUser = () => {
  removeFocus();
  addListener('tbody', 'click', handleRowClick);
};

/**
 * Обработчик события клика на строку таблицы.
 * 
 * @param {Event} event - объект события.
 * 
 * @returns {undefined}
 */
const handleRowClick = (event) => {
  event.preventDefault();

  const target = event.target; // элемент, на который кликнули
  const row = target.closest('tr'); // ищем ближайшую строку

  if (!row) {
    return;
  }
  
  // Получаем id пользователя из первой ячейки строки
  const userIndex = row.cells[0].textContent - 1;

  // Заполняем содержимое модального окна
  document.getElementById('user-id').textContent = usersCurrent[userIndex].id;
  document.getElementById('user-username').textContent = usersCurrent[userIndex].username;
  document.getElementById('user-email').textContent = usersCurrent[userIndex].email;

  // Открываем модальное окно
  const modalInstance = new bootstrap.Modal('#userModal', {keyboard: true});
  modalInstance.show();
};

/**
 * Убирает фокус с активного элемента после закрытия модального окна.
 * Нужен для предотвращения предупреждения браузера "Blocked aria-hidden on an
 * element because its descendant retained focus".
 * @example
 * removeFocus();
 */
const removeFocus = () => {
  document.querySelectorAll('.modal').forEach(modal => {
    addListener(modal, 'hide.bs.modal',  () => {
        document.activeElement.blur();
      });
  });
};

/**
 * Добавляет слушатель события на элемент.
 * Если элемент уже имеет установленный слушатель события, то ничего не делает.
 * 
 * @param {string|Element} target - Идентификатор элемента или сам элемент
 * @param {string} event - Тип события
 * @param {function} func - Функция, которая будет вызвана при срабатывании события
 */
const addListener = (target, event, func) => {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element.dataset.listenerAdded) {
    element.addEventListener(event, func);
    element.dataset.listenerAdded = true; // Флаг устанавливается
  }
};

// const removeListener = (target, event, func) => {
//   const element = typeof target === 'string' ? document.getElementById(target) : target;
//   if (element.dataset.listenerAdded) {
//     element.removeEventListener(event, func);
//     element.dataset.listenerAdded = false; // Флаг сбрасывается
//   }
// };

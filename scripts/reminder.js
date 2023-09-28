const reminderForm = document.querySelector('#reminderParams');
const reminders = document.querySelector('#reminders');

const addButton = reminderForm.querySelector('button');
const [date, time, note] = reminderForm.querySelectorAll('input');

function compareDates(first, second) {
    const firstDate = new Date(`${first.date}T${first.time}:00`);
    const secondDate = new Date(`${second.date}T${second.time}:00`);

    return firstDate - secondDate;
}

const getReminders = async () => {
    const data = await chrome.storage.local.get(['Reminders']);
    let allReminders = data['Reminders'] || [];

    const remindersList = (targetArray) => {
        const fragment = document.createDocumentFragment();

        targetArray.forEach((item) => {
            const editedNote = item.note.length > 10 ? item.note.substring(0, 10) + "..." : item.note;
            const reminderContainer = document.createElement('div');
            reminderContainer.setAttribute('id', item.id);
    
            reminderContainer.setAttribute('style', 'display: flex; justify-content: space-between; height: 20px; min-width: 300px');
            reminderContainer.insertAdjacentHTML('afterbegin', `<p style="margin: 0; width: 200px">${item.date} | ${item.time} | ${editedNote}</p>
                <button>Edit</button>
                <button>Delete</button>`);
            fragment.appendChild(reminderContainer);
        });
    
        reminders.appendChild(fragment);
    }

    remindersList(allReminders);

    addButton.addEventListener('click', () => {
        allReminders.push({ date: date.value, time: time.value, note: note.value, id: Date.now() });

        allReminders.sort(compareDates);

        chrome.storage.local.set({ 'Reminders': allReminders });
        chrome.storage.local.set({ 'LastReminder': { date: date.value, time: time.value, note: note.value, id: Date.now() } });

        reminders.innerHTML = '';

        remindersList(allReminders);

        date.value = '';
        time.value = '';
        note.value = '';
    });

    reminders.addEventListener('click', (event) => {
        const target = event.target;

        if (target.localName === 'button' && target.innerHTML === 'Delete') {
            const currentId = target.parentNode.id;

            target.parentNode.remove();
            allReminders = allReminders.filter((item) => +currentId !== item.id);

            chrome.storage.local.set({ 'Reminders': allReminders });
        }

        if (target.localName === 'button' && target.innerHTML === 'Edit') {
            const currentId = target.parentNode.id;
            const item = allReminders.find((item) => item.id === +currentId);

            target.parentNode.firstChild.remove();
            target.parentNode.insertAdjacentHTML('afterbegin', `
                <div style="display: flex">
                    <input type="date" id="newDate" value="${item.date}" />
                    <input type="time" id="newTime" value="${item.time}" />
                    <input type="text" id="newNote" value="${item.note}" />
                    <button>Save</button>
                </div>
            `);
        }

        if (target.localName === 'button' && target.innerHTML === 'Save') {
            const currentId = target.parentNode.parentNode.id;
            console.log(currentId);
            const newData = {
                date: document.querySelector('#newDate').value,
                id: +currentId,
                time: document.querySelector('#newTime').value,
                note: document.querySelector('#newNote').value                
            };

            const updatedReminders = allReminders.map((reminder) => {
                if (reminder.id === +currentId) {
                    console.log(reminder)
                    return { ...reminder, ...newData };
                }
                return reminder;
            });
            updatedReminders.sort(compareDates);

            chrome.storage.local.set({ 'Reminders': updatedReminders });
            chrome.storage.local.set({ 'LastReminder': newData });

            const targetContainer = target.parentNode.parentNode;
            console.log(targetContainer.parentNode)
            targetContainer.parentNode.innerHTML = '';
            
            remindersList(updatedReminders);
        }
    })
}

getReminders();


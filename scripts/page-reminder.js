const fragment = document.createDocumentFragment();
const createRemindersHTML = `<section>
        <button id="closeReminderFormButton" style="border: 1px solid white; border-radius: 5px">Close</button>
        <h3>Create reminder</h3>
        <div id="reminderParams">
            <input type="date" />
            <input type="time" />
            <input type="text" placeholder="Note" />
            <button style="border: 1px solid white; border-radius: 5px">Add</button>
        </div>
    </section>`;

const mainElement = document.createElement('div');
mainElement.setAttribute('id', 'reminderForm');
mainElement.setAttribute('style', 'padding: 20px; z-index: 9999; display: none; background-color: gray; color: white; width: 100%')
mainElement.innerHTML = createRemindersHTML;

const openButton = document.createElement('button');
openButton.setAttribute('id', 'openReminderFormButton');
openButton.setAttribute('style', 'position: fixed; border: 1px solid white; border-radius: 5px; margin: 10px; z-index: 9999; background-color: gray');
openButton.innerHTML = 'Reminders';

const notifContainer = document.createElement('div');
notifContainer.setAttribute('id', 'notifContainer');

fragment.prepend(openButton);
fragment.prepend(mainElement);

document.body.prepend(fragment);

document.querySelector('#openReminderFormButton').addEventListener('click', () => {
    document.querySelector('#reminderForm').style.setProperty('display', 'block');
    document.querySelector('#openReminderFormButton').style.setProperty('display', 'none');
});

document.querySelector('#closeReminderFormButton').addEventListener('click', () => {
    document.querySelector('#openReminderFormButton').style.setProperty('display', 'block');
    document.querySelector('#reminderForm').style.setProperty('display', 'none');
});

const notifHandler = (element) => {
    const { date, note, time, id } = element;
    const reminderNotification = document.createElement('div');

    reminderNotification.setAttribute('style', 'display: flex; padding: 4px; border: 1px solid white; border-radius: 5px; margin: 10px; z-index: 9999; background-color: green');
    reminderNotification.setAttribute('id', id)
    reminderNotification.innerHTML = `<h3 style="margin: 0">Notif you about: ${note} | ${date} | ${time}</h3><button style="margin-left: 20px; border: 1px solid white; border-radius: 5px">Close</button>`;

    if (document.getElementById('notifContainer')) {
        document.querySelector('#notifContainer').prepend(reminderNotification);
    } else {
        document.body.prepend(notifContainer);
        document.querySelector('#notifContainer').prepend(reminderNotification);
    }
}

const hideAllElements = () => {
    document.querySelector('#reminderForm').style.setProperty('display', 'none');
    document.querySelector('#openReminderFormButton').style.setProperty('display', 'none');
}

const reminderForm = document.querySelector('#reminderParams');
const reminders = document.querySelector('#reminders');

const addButton = reminderForm.querySelector('button');
const [date, time, note] = reminderForm.querySelectorAll('input');

const currentDate = new Date();

let allReminders;

let ownReminders = [];

const getReminders = async () => {
    const data = await chrome.storage.local.get(['Reminders']);
    allReminders = data['Reminders'] || [];
}

const sortByDate = (first, second) => {
    const firstDate = new Date(`${first.date}T${first.time}:00`);
    const secondDate = new Date(`${second.date}T${second.time}:00`);

    return firstDate - secondDate;
}

const checkNotiForToday = (noti) => {
    const tomorrow = new Date();
    const dateCheck = new Date(noti.date);
    tomorrow.setDate(currentDate.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return dateCheck < tomorrow ? true : false;
}

const checkThisNoti = () => {
    if (ownReminders.length > 0) {
        const checkTheDate = new Date();
        const targetTime = new Date(`${ownReminders[0].date}T${ownReminders[0].time}:00`);

        if (!checkNotiForToday(ownReminders[0])) {
            return;
        }

        setTimeout(() => {
            if (checkTheDate >= targetTime) {
                hideAllElements();
                notifHandler(ownReminders[0]);
                ownReminders.shift();
                checkThisNoti();
            } else {
                checkThisNoti();
            }
        }, 1000)
    }
}

const postTheNotification = (reminder) => {
    const targetTime = new Date(`${reminder.date}T${reminder.time}:00`);

    if (currentDate >= targetTime) {
        hideAllElements();
        notifHandler(reminder);

        return true;
    }
    return false;
}

const allAtOne = () => {
    const fragment = document.createDocumentFragment();

    allReminders.forEach((reminder) => {
        const targetTime = new Date(`${reminder.date}T${reminder.time}:00`);

        if (currentDate >= targetTime) {
            hideAllElements();
            const { date, note, time, id } = reminder;
            const reminderNotification = document.createElement('div');

            reminderNotification.setAttribute('style', 'display: flex; padding: 4px; border: 1px solid white; border-radius: 5px; margin: 10px; z-index: 9999; background-color: green');
            reminderNotification.setAttribute('id', id)
            reminderNotification.innerHTML = `<h3 style="margin: 0">Notif you about: ${note} | ${date} | ${time}</h3><button style="margin-left: 20px; border: 1px solid white; border-radius: 5px">Close</button>`;
            if (document.getElementById('notifContainer')) {
                fragment.prepend(reminderNotification);
            } else {
                document.body.prepend(notifContainer);
                fragment.prepend(reminderNotification);
            }
            document.querySelector('#notifContainer').prepend(fragment)
        }
    });

}

const startChecking = async () => {
    await getReminders()

    if (!allReminders.length) {
        return;
    }

    allAtOne();

    ownReminders = allReminders.filter((element) => {
        const targetTime = new Date(`${element.date}T${element.time}:00`);
        return currentDate < targetTime;
    });

    if (ownReminders[0] && checkNotiForToday(ownReminders[0])) {
        checkThisNoti();
    }
}

startChecking();

const removeReminder = (id) => {
    allReminders = allReminders.filter((item) => +id !== item.id);
    chrome.storage.local.set({ 'Reminders': allReminders });
}

chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes['LastReminder']) {
        const lastReminder = await chrome.storage.local.get(['LastReminder']);

        if (postTheNotification(lastReminder['LastReminder'])) {
            return;
        }

        ownReminders.push(lastReminder['LastReminder']);
        ownReminders.sort(sortByDate);

        if (ownReminders.length === 1 || checkNotiForToday(lastReminder['LastReminder'])) {
            checkThisNoti();
        }
    }
});

notifContainer.addEventListener('click', (event) => {
    const target = event.target;

    if (target.localName === 'button') {
        if (target.parentNode.parentNode.childElementCount === 1) {
            removeReminder(target.parentNode.id);
            target.parentNode.parentNode.remove();
            target.parentNode.remove();
            document.querySelector('#openReminderFormButton').style.setProperty('display', 'block');
        } else {
            removeReminder(target.parentNode.id);
            target.parentNode.remove();
        }
    }
})

addButton.addEventListener('click', () => {
    const reminder = { date: date.value, time: time.value, note: note.value, id: Date.now() }

    allReminders.push(reminder);

    allReminders.sort(sortByDate);

    chrome.storage.local.set({ 'Reminders': allReminders });
    chrome.storage.local.set({ 'LastReminder': reminder });

    date.value = '';
    time.value = '';
    note.value = '';
});

window.scrollTo(0, 0);
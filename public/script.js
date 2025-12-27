document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule-container');
    const searchBar = document.getElementById('search-bar');
    let talksData = [];

    // Fetch talk data from the backend API
    fetch('/api/talks')
        .then(response => response.json())
        .then(data => {
            talksData = data;
            renderSchedule(talksData);
        })
        .catch(error => {
            console.error('Error fetching talks:', error);
            scheduleContainer.innerHTML = '<p>Error loading schedule. Please try again later.</p>';
        });

    // Add event listener for the search bar
    searchBar.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredTalks = talksData.filter(talk => {
            return talk.categories.some(category => category.toLowerCase().includes(searchTerm));
        });
        
        // With a backend, we can't just filter the entire schedule
        // because the breaks are static. Instead, we'll just hide/show talk items.
        const allItems = document.querySelectorAll('.schedule-item[data-talk-id]');
        const visibleTalkIds = new Set(filteredTalks.map(t => t.title)); // Use title as a unique ID for this simple case

        allItems.forEach(item => {
            const talkId = item.getAttribute('data-talk-id');
            if (visibleTalkIds.has(talkId) || searchTerm === '') {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });

    /**
     * Renders the entire event schedule
     * @param {Array} talks - The array of talk objects
     */
    function renderSchedule(talks) {
        let currentTime = new Date();
        currentTime.setHours(10, 0, 0, 0); // Event starts at 10:00 AM

        talks.forEach((talk, index) => {
            // Render the talk
            const talkEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
            scheduleContainer.appendChild(createTalkElement(talk, currentTime, talkEndTime));
            currentTime = talkEndTime;

            // Render breaks
            if (index === 2) { // Lunch break after the 3rd talk
                const breakEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
                scheduleContainer.appendChild(createBreakElement('Lunch Break', currentTime, breakEndTime));
                currentTime = breakEndTime;
            } else if (index < talks.length - 1) { // Transition between other talks
                const breakEndTime = new Date(currentTime.getTime() + 10 * 60 * 1000);
                scheduleContainer.appendChild(createBreakElement('Transition', currentTime, breakEndTime));
                currentTime = breakEndTime;
            }
        });
    }

    /**
     * Creates an HTML element for a talk
     * @param {Object} talk - The talk data
     * @param {Date} startTime - The start time of the talk
     * @param {Date} endTime - The end time of the talk
     * @returns {HTMLElement}
     */
    function createTalkElement(talk, startTime, endTime) {
        const item = document.createElement('div');
        item.className = 'schedule-item';
        item.setAttribute('data-talk-id', talk.title); // Use title as a unique ID

        const timeString = `${formatTime(startTime)} - ${formatTime(endTime)}`;

        item.innerHTML = `
            <div class="schedule-item-meta">
                <span class="time">${timeString}</span>
                <span class="speakers">By: ${talk.speakers.join(', ')}</span>
            </div>
            <h2>${talk.title}</h2>
            <p>${talk.description}</p>
            <div class="categories">
                ${talk.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
            </div>
        `;
        return item;
    }

    /**
     * Creates an HTML element for a break
     * @param {String} title - The title of the break
     * @param {Date} startTime - The start time of the break
     * @param {Date} endTime - The end time of the break
     * @returns {HTMLElement}
     */
    function createBreakElement(title, startTime, endTime) {
        const item = document.createElement('div');
        item.className = 'schedule-item break';
        const timeString = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        item.innerHTML = `
            <div class="schedule-item-meta">
                <span class="time">${timeString}</span>
            </div>
            <h2>${title}</h2>
        `;
        return item;
    }

    /**
     * Formats a Date object into a HH:MM AM/PM string
     * @param {Date} date - The date to format
     * @returns {String}
     */
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
});

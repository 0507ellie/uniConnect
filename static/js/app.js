// Client-side JavaScript for static uniConnect site
class UniConnect {
    constructor() {
        this.events = [];
        this.originalEvents = [];
        this.selectedFilters = {
            categories: [],
            days: [],
            colleges: []
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadEvents();
            this.loadSelectedFilters();
            this.renderEvents();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    async loadEvents() {
        try {
            const response = await fetch('static/u_of_t_events.json');
            if (!response.ok) throw new Error('Failed to load events');
            
            this.originalEvents = await response.json();
            this.events = [...this.originalEvents];
            
            // Convert timestamps to readable dates
            this.events = this.events.map(event => {
                const eventCopy = { ...event };
                
                if (Array.isArray(eventCopy.sorting_info) && 
                    typeof eventCopy.sorting_info[0] === 'number' && 
                    eventCopy.sorting_info[0] > 0) {
                    
                    const date = new Date(eventCopy.sorting_info[0] * 1000);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    
                    eventCopy.sorting_info = [
                        formattedDate,
                        eventCopy.sorting_info[1],
                        eventCopy.sorting_info[2]
                    ];
                }

                if (eventCopy.posted_time && eventCopy.posted_time !== 0) {
                    const postedDate = new Date(eventCopy.posted_time * 1000);
                    eventCopy.posted_time = postedDate.toLocaleDateString('en-US') + 
                                           ' ' + postedDate.toLocaleTimeString('en-US');
                }

                return eventCopy;
            });
        } catch (error) {
            console.error('Error loading events:', error);
            this.events = [];
        }
    }

    loadSelectedFilters() {
        const stored = localStorage.getItem('selectedFilters');
        if (stored) {
            this.selectedFilters = JSON.parse(stored);
        }
        
        // Update checkboxes based on stored filters
        this.updateCheckboxes();
    }

    saveSelectedFilters() {
        localStorage.setItem('selectedFilters', JSON.stringify(this.selectedFilters));
    }

    updateCheckboxes() {
        $('input[type="checkbox"]').each((index, checkbox) => {
            const $checkbox = $(checkbox);
            const value = $checkbox.val();
            const name = $checkbox.attr('name');

            let isChecked = false;
            if (name === 'category-checkbox' && this.selectedFilters.categories.includes(value)) {
                isChecked = true;
            } else if (name === 'week-checkbox' && this.selectedFilters.days.includes(value)) {
                isChecked = true;
            } else if (name === 'college-checkbox' && this.selectedFilters.colleges.includes(value)) {
                isChecked = true;
            }

            $checkbox.prop('checked', isChecked);
        });
    }

    renderEvents() {
        const container = document.getElementById('events-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.events.length === 0) {
            container.innerHTML = '<div class="node"><p>No events found matching your criteria.</p></div>';
            return;
        }

        this.events.forEach(event => {
            const eventElement = this.createEventElement(event);
            container.appendChild(eventElement);
        });
    }

    createEventElement(event) {
        const div = document.createElement('div');
        div.className = 'node';

        const eventName = event.name || 'Unnamed Event';
        const eventCollege = Array.isArray(event.sorting_info) ? event.sorting_info[2] : '';
        const eventDate = Array.isArray(event.sorting_info) ? event.sorting_info[0] : '';
        const eventLocation = event.location || '';
        const eventDesc = event.desc || '';
        const eventImage = event.image;
        
        let postedTime = '';
        if (event.posted_time && event.posted_time !== 0) {
            postedTime = `<p class="event-location">Posted on ${event.posted_time}</p><br/>`;
        }

        if (eventImage) {
            div.innerHTML = `
                <div class="flex">
                    <img class="event-img" src="${eventImage}" alt="${eventName}">
                    <div class="event-text grid">
                        <strong class="event-name">
                            <a href="#" onclick="app.showEventDetails('${eventName.replace(/'/g, "\\'")}')">${eventName}</a>
                        </strong>
                        <p>${eventCollege}</p>
                        ${eventLocation ? `<p class="event-location">${eventLocation}</p>` : ''}
                        <p class="event-location">${eventDate}</p><br/>
                        ${postedTime}
                        <p class="event-short-desc">${eventDesc}</p>
                    </div>
                </div>
            `;
        } else {
            div.innerHTML = `
                <strong class="event-name">
                    <a href="#" onclick="app.showEventDetails('${eventName.replace(/'/g, "\\'")}')">${eventName}</a>
                </strong>
                <p>${eventCollege}</p>
                ${eventLocation ? `<p class="event-location">${eventLocation}</p>` : ''}
                <p class="event-location">${eventDate}</p><br/>
                ${postedTime}
                <p>${eventDesc}</p>
            `;
        }

        return div;
    }

    showEventDetails(eventName) {
        const event = this.events.find(e => e.name === eventName);
        if (!event) return;

        // Create a simple modal or navigate to event page
        const modal = this.createEventModal(event);
        document.body.appendChild(modal);
    }

    createEventModal(event) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        const content = document.createElement('div');
        content.className = 'bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto m-4';

        let postedTime = '';
        if (event.posted_time && event.posted_time !== 0) {
            postedTime = `<p class="event-location">Posted on ${event.posted_time}</p><br/>`;
        }

        content.innerHTML = `
            <button onclick="document.body.removeChild(this.closest('.fixed'))" 
                    class="float-right text-2xl font-bold">&times;</button>
            
            ${event.image ? `
                <div class="ind-content flex mb-4">
                    <img class="ind-event-img max-w-md" src="${event.image}" alt="${event.name}">
                    <div class="ind-event-text grid ml-6">
                        <strong class="event-name text-xl mb-2">${event.name}</strong>
                        <p class="mb-1">${Array.isArray(event.sorting_info) ? event.sorting_info[2] : ''}</p>
                        ${event.location ? `<p class="event-location mb-1">${event.location}</p>` : ''}
                        <p class="event-location mb-2">${Array.isArray(event.sorting_info) ? event.sorting_info[0] : ''}</p>
                        ${postedTime}
                    </div>
                </div>
                <p class="ind-event-desc leading-relaxed">${event.desc || ''}</p>
            ` : `
                <div class="ind-content">
                    <div class="no-img-content">
                        <strong class="event-name text-xl mb-2 block">${event.name}</strong>
                        <p class="mb-1">${Array.isArray(event.sorting_info) ? event.sorting_info[2] : ''}</p>
                        ${event.location ? `<p class="event-location mb-1">${event.location}</p>` : ''}
                        <p class="event-location mb-2">${Array.isArray(event.sorting_info) ? event.sorting_info[0] : ''}</p>
                        ${postedTime}
                        <p class="event-short-desc leading-relaxed">${event.desc || ''}</p>
                    </div>
                </div>
            `}
        `;

        modal.appendChild(content);
        return modal;
    }

    filterEvents() {
        if (this.selectedFilters.categories.length === 0 && 
            this.selectedFilters.days.length === 0 && 
            this.selectedFilters.colleges.length === 0) {
            this.events = [...this.originalEvents];
        } else {
            this.events = this.originalEvents.filter(event => {
                let matches = false;

                // Check categories
                if (this.selectedFilters.categories.length > 0) {
                    const eventCategory = Array.isArray(event.sorting_info) ? event.sorting_info[1] : '';
                    if (this.selectedFilters.categories.includes(eventCategory)) {
                        matches = true;
                    }
                }

                // Check colleges
                if (this.selectedFilters.colleges.length > 0) {
                    const eventCollege = Array.isArray(event.sorting_info) ? event.sorting_info[2] : '';
                    if (this.selectedFilters.colleges.includes(eventCollege)) {
                        matches = true;
                    }
                }

                // Check days (would need to convert timestamp to day of week)
                if (this.selectedFilters.days.length > 0) {
                    // For now, skip day filtering since it requires more complex logic
                    // You could implement this by converting the timestamp to day of week
                }

                return matches || (this.selectedFilters.categories.length === 0 && 
                                 this.selectedFilters.colleges.length === 0);
            });
        }

        // Convert timestamps again after filtering
        this.events = this.events.map(event => {
            const eventCopy = { ...event };
            
            if (Array.isArray(eventCopy.sorting_info) && 
                typeof eventCopy.sorting_info[0] === 'number' && 
                eventCopy.sorting_info[0] > 0) {
                
                const date = new Date(eventCopy.sorting_info[0] * 1000);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                eventCopy.sorting_info = [
                    formattedDate,
                    eventCopy.sorting_info[1],
                    eventCopy.sorting_info[2]
                ];
            }

            if (eventCopy.posted_time && eventCopy.posted_time !== 0) {
                const postedDate = new Date(eventCopy.posted_time * 1000);
                eventCopy.posted_time = postedDate.toLocaleDateString('en-US') + 
                                       ' ' + postedDate.toLocaleTimeString('en-US');
            }

            return eventCopy;
        });

        this.renderEvents();
    }

    setupEventListeners() {
        // Toggle user form
        window.toggleMenu = () => {
            const userForm = document.getElementById("user-form");
            userForm.classList.toggle("open-form");
        };

        // Sub-menu toggles
        $('.sub-btn').click(function(){
            $(this).next('.sub-menu').slideToggle();
            $(this).find('.dropdown').toggleClass('rotate');
        });

        // Checkbox change handlers
        $('input[type="checkbox"]').change(() => {
            this.updateSelectedFilters();
            this.saveSelectedFilters();
            this.filterEvents();
        });

        // Reset filters
        $("#resetFilters").click(() => {
            this.selectedFilters = {
                categories: [],
                days: [],
                colleges: []
            };
            $('input[type="checkbox"]').prop("checked", false);
            this.saveSelectedFilters();
            this.filterEvents();
        });

        // User info form
        $('#userInfoForm').submit((e) => {
            e.preventDefault();
            const formData = {
                college: $('#college').val(),
                major: $('#major').val(),
                preferred_categories: $('#preferred_categories').val()
            };
            localStorage.setItem('userInfo', JSON.stringify(formData));
            alert('User information saved!');
        });

        // Load saved user info
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
            const userInfo = JSON.parse(savedUserInfo);
            $('#college').val(userInfo.college || '');
            $('#major').val(userInfo.major || '');
            $('#preferred_categories').val(userInfo.preferred_categories || '');
        }
    }

    updateSelectedFilters() {
        this.selectedFilters = {
            categories: [],
            days: [],
            colleges: []
        };

        $('input[type="checkbox"]:checked').each((index, checkbox) => {
            const value = $(checkbox).val();
            const name = $(checkbox).attr("name");

            if (name === "category-checkbox") {
                this.selectedFilters.categories.push(value);
            } else if (name === "week-checkbox") {
                this.selectedFilters.days.push(value);
            } else if (name === "college-checkbox") {
                this.selectedFilters.colleges.push(value);
            }
        });
    }
}

// Initialize the app when DOM is ready
$(document).ready(() => {
    window.app = new UniConnect();
});

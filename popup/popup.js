// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selections ---
    const viewFlipper = document.querySelector('.view-flipper');
    const viewToggle = document.getElementById('viewToggle');
    const viewTitle = document.getElementById('view-title');

    const consolidateBtn = document.getElementById('consolidateBtn');
    const hibernateTabsList = document.getElementById('tabsList');
    const goToTabList = document.getElementById('goToTabList');

    // --- Map to store relation between list items and tab IDs ---
    const goToTabMap = new Map();

    // --- Event Listener for the Main View Toggle Switch ---
    viewToggle.addEventListener('change', (event) => {
        if (event.target.checked) {
            // Switched to "Go to Tab" view
            viewFlipper.classList.add('goto-active');
            viewTitle.textContent = 'Go to Tab';
            populateGoToTabList(); // Populate the list when switching to it
        } else {
            // Switched back to "Manage Tabs" view
            viewFlipper.classList.remove('goto-active');
            viewTitle.textContent = 'Manage Tabs';
            populateHibernateList(); // Refresh the hibernate list
        }
    });

    // --- Event Listener for "Go to Tab" List ---
    goToTabList.addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (!listItem) return;

        const tabId = goToTabMap.get(listItem.id);
        if (tabId) {
            chrome.tabs.get(tabId, (tab) => {
                chrome.windows.update(tab.windowId, { focused: true });
                chrome.tabs.update(tabId, { active: true });
                window.close();
            });
        }
    });

    // --- Function to Populate the "Go to Tab" List ---
    function populateGoToTabList() {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            goToTabList.innerHTML = '';
            goToTabMap.clear();

            tabs.forEach((tab, index) => {
                const listItem = document.createElement('li');
                const uniqueId = `goto-tab-${index}`;
                listItem.id = uniqueId;

                const icon = document.createElement('img');
                icon.src = tab.favIconUrl || '../icons/icon16.png';
                icon.className = 'tab-icon';

                const title = document.createElement('span');
                title.textContent = tab.title;
                title.className = 'tab-title';

                listItem.appendChild(icon);
                listItem.appendChild(title);
                goToTabList.appendChild(listItem);

                goToTabMap.set(uniqueId, tab.id);
            });
        });
    }

    // --- Consolidate Button Logic ---
    consolidateBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "consolidateTabs" }, () => window.close());
    });

    // --- Function to Populate the Hibernate/Discard List ---
    function populateHibernateList() {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            hibernateTabsList.innerHTML = '';
            tabs.forEach(tab => {
                const listItem = document.createElement('li');
                listItem.dataset.tabId = tab.id;

                const icon = document.createElement('img');
                icon.src = tab.favIconUrl || '../icons/icon16.png';
                icon.className = 'tab-icon';

                const title = document.createElement('span');
                title.textContent = tab.title;
                title.className = 'tab-title';

                if (tab.discarded) {
                    listItem.classList.add('discarded');
                    title.textContent += ' (Sleeping)';
                }

                listItem.appendChild(icon);
                listItem.appendChild(title);

                listItem.addEventListener('click', () => {
                    const tabIdToDiscard = parseInt(listItem.dataset.tabId, 10);
                    chrome.tabs.discard(tabIdToDiscard, () => {
                        populateHibernateList(); // Refresh list after discarding
                    });
                });
                hibernateTabsList.appendChild(listItem);
            });
        });
    }

    // --- Initial Population on Popup Open ---
    populateHibernateList();
});
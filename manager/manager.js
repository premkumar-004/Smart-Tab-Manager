// manager.js

document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('linked-list-container');
    const pageTitle = document.getElementById('page-title');

    pageTitle.textContent = "All Linked Tabs";

    // --- Main Function to Render All Groups ---
    function renderAllTabGroups() {
        mainContainer.innerHTML = ''; // Clear the container first

        chrome.storage.local.get(null, (allData) => {
            const tabGroups = [];
            for (const key in allData) {
                if (key.startsWith('savedTabs_')) {
                    tabGroups.push({
                        key: key,
                        timestamp: parseInt(key.split('_')[1], 10),
                        tabs: allData[key]
                    });
                }
            }

            if (tabGroups.length === 0) {
                mainContainer.innerHTML = '<p>No tabs have been consolidated yet.</p>';
                return;
            }

            tabGroups.sort((a, b) => b.timestamp - a.timestamp);

            tabGroups.forEach(group => {
                const groupContainer = document.createElement('div');
                groupContainer.className = 'tab-group';
                groupContainer.id = group.key; // Assign ID for easy removal

                // --- 1. CREATE GROUP HEADER AND DELETE BUTTON ---
                const header = document.createElement('h2');
                header.className = 'tab-group-header';

                const deleteGroupBtn = document.createElement('button');
                deleteGroupBtn.className = 'delete-group-btn';
                deleteGroupBtn.textContent = 'Delete Group';

                // Event listener for deleting the entire group
                deleteGroupBtn.addEventListener('click', () => {
                    chrome.storage.local.remove(group.key, () => {
                        groupContainer.classList.add('fade-out');
                        setTimeout(() => groupContainer.remove(), 400);
                    });
                });

                const date = new Date(group.timestamp);
                const formattedDate = date.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
                const tabCount = group.tabs.length;

                const titleSpan = document.createElement('span');
                titleSpan.innerHTML = `${formattedDate} <span>(${tabCount} tabs)</span>`;

                header.appendChild(deleteGroupBtn); // Add button to header
                header.appendChild(titleSpan); // Add title text
                groupContainer.appendChild(header);

                // --- 2. CREATE INDIVIDUAL TAB NODES AND THEIR DELETE BUTTONS ---
                group.tabs.forEach((tab, index) => {
                    const nodeLink = document.createElement('a');
                    nodeLink.href = tab.url;
                    nodeLink.target = '_blank';
                    nodeLink.className = 'node';
                    nodeLink.dataset.index = index; // Store index for deletion

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'node-content';

                    const icon = document.createElement('img');
                    icon.src = tab.favIconUrl || '../icons/icon16.png';
                    icon.className = 'node-icon';

                    const title = document.createElement('span');
                    title.textContent = tab.title;
                    title.className = 'node-title';

                    const connector = document.createElement('div');
                    connector.className = 'node-connector';

                    const deleteNodeBtn = document.createElement('button');
                    deleteNodeBtn.className = 'delete-node-btn';
                    deleteNodeBtn.innerHTML = '&times;'; // A simple "x" character

                    // Event listener for deleting a single tab
                    deleteNodeBtn.addEventListener('click', (e) => {
                        e.preventDefault(); // Prevent link from opening
                        e.stopPropagation(); // Stop event from bubbling up

                        // Remove this specific tab from the array
                        const updatedTabs = group.tabs.filter((_, i) => i !== index);

                        // If the group is now empty, delete the whole group
                        if (updatedTabs.length === 0) {
                            chrome.storage.local.remove(group.key, () => {
                                groupContainer.classList.add('fade-out');
                                setTimeout(() => groupContainer.remove(), 400);
                            });
                        } else {
                            // Otherwise, just update the group with the shorter list
                            chrome.storage.local.set({ [group.key]: updatedTabs }, () => {
                                // Animate and remove just this node
                                nodeLink.classList.add('fade-out');
                                setTimeout(() => nodeLink.remove(), 400);
                                // Note: For simplicity, we don't re-render the whole page here
                                // to update the tab count, but you could call renderAllTabGroups()
                            });
                        }
                    });

                    contentDiv.appendChild(icon);
                    contentDiv.appendChild(title);
                    nodeLink.appendChild(contentDiv);
                    nodeLink.appendChild(connector);
                    nodeLink.appendChild(deleteNodeBtn); // Add individual delete button

                    groupContainer.appendChild(nodeLink);
                });

                mainContainer.appendChild(groupContainer);
            });
        });
    }

    // --- Initial Render ---
    renderAllTabGroups();
});
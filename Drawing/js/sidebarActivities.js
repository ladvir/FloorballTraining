// js/sidebarActivities.js
import { appState } from './state.js';
import { DEFAULT_ACTIVITIES } from './config.js';
import { dom } from './dom.js';
import { createGhostPreview } from './dragDrop.js'; // Needs ghost creation logic

/** Loads activities from localStorage or defaults, populating the sidebar. */
export function loadActivities() {
    dom.activityList.querySelectorAll('.activity-item').forEach(item => item.remove());

    let storedActivities = localStorage.getItem("activities");
    let parsedActivities = null;
    if (storedActivities) {
        try {
            parsedActivities = JSON.parse(storedActivities);
            if (!Array.isArray(parsedActivities)) {
                console.warn("Stored activities data is not an array. Using defaults.");
                parsedActivities = null;
            }
        } catch (e) {
            console.error("Error parsing stored activities:", e, "Using defaults.");
            parsedActivities = null;
        }
    }

    appState.activities = parsedActivities || [...DEFAULT_ACTIVITIES];
    localStorage.setItem("activities", JSON.stringify(appState.activities)); // Save corrected/default

    // Populate UI
    appState.activities.forEach((activity, index) => {
        if (activity && activity.id != null && typeof activity.name === 'string' && typeof activity.svg === 'string') {
            const item = document.createElement("div");
            item.className = "sidebar-item-base activity-item";
            item.textContent = activity.name; // Show name in sidebar
            item.draggable = true;
            item.dataset.activityId = String(activity.id);
            item.addEventListener("dragstart", handleActivityDragStart);
            dom.activityList.appendChild(item);
        } else {
            console.warn(`Skipping invalid activity item at index ${index}:`, activity);
        }
    });
}


/** Sets up dataTransfer and ghost preview for dragging an activity item. */
export function handleActivityDragStart(event) {
    const activityId = event.target.dataset.activityId || "";
    const activity = appState.activities.find(a => String(a.id) === activityId);

    if (activity) {
        event.dataTransfer.setData("text/plain", activityId); // Pass ID
        event.dataTransfer.setData("application/source", "activity");
        event.dataTransfer.effectAllowed = "copy";

        appState.currentDraggingItemInfo = {
            type: 'activity',
            id: activity.id, // Keep ID if needed on drop
            width: 120,
            height: 80,
            svgContent: activity.svg,
            name: activity.name
        };
        createGhostPreview(event); // Function from dragDrop.js
    } else {
        console.error("Could not find activity data for ID:", activityId);
        event.preventDefault();
    }
}